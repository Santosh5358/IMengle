package com.anonconnect.service;

import com.anonconnect.dto.DashboardStats;
import com.anonconnect.dto.DirectCallAccessDTO;
import com.anonconnect.dto.DirectCallAccessRequest;
import com.anonconnect.dto.UserDTO;
import com.anonconnect.entity.Report;
import com.anonconnect.entity.User;
import com.anonconnect.exception.AppException;
import com.anonconnect.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ActiveConnectionRepository activeConnectionRepository;

    public DashboardStats getDashboardStats() {
        Instant today = Instant.now().truncatedTo(ChronoUnit.DAYS);

        return DashboardStats.builder()
                .totalUsers(userRepository.count())
                .onlineUsers(activeConnectionRepository.countDistinctByUserId())
                .activeSocketConnections(activeConnectionRepository.count())
                .activeSessions(chatSessionRepository.countByStatus("ACTIVE"))
                .pendingReports(reportRepository.countByStatus("PENDING"))
                .bannedUsers(userRepository.countBannedUsers())
                .totalSessionsToday(chatSessionRepository.countByStartTimeGreaterThan(today))
                .build();
    }

    public Page<Report> getPendingReports(Pageable pageable) {
        return reportRepository.findByStatus("PENDING", pageable);
    }

    public void resolveReport(String reportId, String adminId, String action) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Report not found"));

        if (!userRepository.existsById(adminId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Admin not found");
        }

        String resolvedAction = action.toUpperCase();

        if ("BANNED".equalsIgnoreCase(resolvedAction)) {
            String reportedUserId = report.getReportedId();
            if (!StringUtils.hasText(reportedUserId)) {
                reportedUserId = report.getReportedUserId();
            }
            if (!StringUtils.hasText(reportedUserId)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Cannot ban user: missing reported user id in report");
            }

            // Ban first so we do not mark the report as banned if ban action fails.
            banUser(reportedUserId, "Banned due to report: " + report.getReason());
            report.setReportedId(reportedUserId);
        }

        report.setStatus(resolvedAction);
        report.setReviewedById(adminId);
        report.setReviewedAt(Instant.now());
        reportRepository.save(report);

        log.info("Report {} resolved with action: {} by admin: {}", reportId, resolvedAction, adminId);
    }

    public void banUser(String userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        user.setIsBanned(true);
        user.setBanReason(reason);
        userRepository.save(user);
        log.info("User {} banned: {}", userId, reason);
    }

    public void unbanUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        user.setIsBanned(false);
        user.setBanReason(null);
        userRepository.save(user);
        log.info("User {} unbanned", userId);
    }

    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toDTO);
    }

    public List<DirectCallAccessDTO> getDirectCallAccessList() {
        return userRepository.findAll().stream()
                .map(this::toDirectCallAccessDTO)
                .collect(Collectors.toList());
    }

    public DirectCallAccessDTO updateDirectCallAccess(DirectCallAccessRequest request) {
        if (request == null || !StringUtils.hasText(request.getUsername())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Username is required");
        }

        User user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        boolean enabled = Boolean.TRUE.equals(request.getEnabled());
        user.setDirectCallEnabled(enabled);

        List<String> allowedIds = new ArrayList<>();
        if (enabled && request.getAllowedUsernames() != null) {
            for (String rawUsername : request.getAllowedUsernames()) {
                if (!StringUtils.hasText(rawUsername)) {
                    continue;
                }

                String normalized = rawUsername.trim();
                User allowedUser = userRepository.findByUsername(normalized)
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Allowed user not found: " + normalized));

                if (!allowedUser.getId().equals(user.getId())) {
                    allowedIds.add(allowedUser.getId());
                }
            }
        }

        user.setDirectCallAllowedUserIds(allowedIds);
        userRepository.save(user);
        return toDirectCallAccessDTO(user);
    }

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .country(user.getCountry())
                .gender(user.getGender())
                .role(user.getRole())
                .isBanned(user.getIsBanned())
                .directCallEnabled(Boolean.TRUE.equals(user.getDirectCallEnabled()))
                .directCallAllowedUserIds(user.getDirectCallAllowedUserIds() == null ? List.of() : user.getDirectCallAllowedUserIds())
                .lastActive(user.getLastActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private DirectCallAccessDTO toDirectCallAccessDTO(User user) {
        List<String> allowedUsernames = new ArrayList<>();
        List<String> allowedIds = user.getDirectCallAllowedUserIds() == null ? List.of() : user.getDirectCallAllowedUserIds();

        for (String id : allowedIds) {
            userRepository.findById(id).ifPresent(allowed -> allowedUsernames.add(allowed.getUsername()));
        }

        return DirectCallAccessDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .enabled(Boolean.TRUE.equals(user.getDirectCallEnabled()))
                .allowedUsernames(allowedUsernames)
                .build();
    }
}
