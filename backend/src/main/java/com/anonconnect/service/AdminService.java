package com.anonconnect.service;

import com.anonconnect.dto.DashboardStats;
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

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .country(user.getCountry())
                .gender(user.getGender())
                .role(user.getRole())
                .isBanned(user.getIsBanned())
                .lastActive(user.getLastActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
