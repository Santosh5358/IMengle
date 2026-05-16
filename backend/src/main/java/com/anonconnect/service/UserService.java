package com.anonconnect.service;

import com.anonconnect.dto.ReportRequest;
import com.anonconnect.entity.*;
import com.anonconnect.exception.AppException;
import com.anonconnect.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final ReportRepository reportRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ActiveConnectionRepository activeConnectionRepository;

    public long getOnlineUserCount() {
        return activeConnectionRepository.count();
    }

    @Transactional
    public void updateLastActive(UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastActive(Instant.now());
            userRepository.save(user);
        });
    }

    @Transactional
    public void reportUser(UUID reporterId, ReportRequest request) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Reporter not found"));

        User reported = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Reported user not found"));

        ChatSession session = null;
        if (request.getSessionId() != null) {
            session = chatSessionRepository.findById(request.getSessionId()).orElse(null);
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reported(reported)
                .session(session)
                .reason(request.getReason())
                .description(request.getDescription())
                .build();

        reportRepository.save(report);
        log.info("User {} reported user {} for: {}", reporterId, request.getReportedUserId(), request.getReason());
    }

    @Transactional
    public void blockUser(UUID blockerId, UUID blockedId) {
        if (blockedUserRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            throw new AppException(HttpStatus.CONFLICT, "User already blocked");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        BlockedUser block = BlockedUser.builder()
                .blocker(blocker)
                .blocked(blocked)
                .build();

        blockedUserRepository.save(block);
        log.info("User {} blocked user {}", blockerId, blockedId);
    }

    @Transactional
    public void unblockUser(UUID blockerId, UUID blockedId) {
        blockedUserRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
        log.info("User {} unblocked user {}", blockerId, blockedId);
    }

    public List<UUID> getBlockedUserIds(UUID userId) {
        return blockedUserRepository.findByBlockerId(userId).stream()
                .map(b -> b.getBlocked().getId())
                .collect(Collectors.toList());
    }
}
