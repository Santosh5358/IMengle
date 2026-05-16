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
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

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
                .onlineUsers(activeConnectionRepository.count())
                .activeSessions(chatSessionRepository.countActiveSessions())
                .pendingReports(reportRepository.countByStatus("PENDING"))
                .bannedUsers(userRepository.countBannedUsers())
                .totalSessionsToday(chatSessionRepository.countSessionsSince(today))
                .build();
    }

    public Page<Report> getPendingReports(Pageable pageable) {
        return reportRepository.findByStatus("PENDING", pageable);
    }

    @Transactional
    public void resolveReport(UUID reportId, UUID adminId, String action) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Report not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Admin not found"));

        report.setStatus(action.toUpperCase());
        report.setReviewedBy(admin);
        report.setReviewedAt(Instant.now());
        reportRepository.save(report);

        if ("BANNED".equalsIgnoreCase(action)) {
            banUser(report.getReported().getId(), "Banned due to report: " + report.getReason());
        }

        log.info("Report {} resolved with action: {} by admin: {}", reportId, action, adminId);
    }

    @Transactional
    public void banUser(UUID userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        user.setIsBanned(true);
        user.setBanReason(reason);
        userRepository.save(user);
        log.info("User {} banned: {}", userId, reason);
    }

    @Transactional
    public void unbanUser(UUID userId) {
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
                .id(user.getId().toString())
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
