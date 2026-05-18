package com.anonconnect.service;

import com.anonconnect.dto.ReportRequest;
import com.anonconnect.dto.DirectCallConfigResponse;
import com.anonconnect.entity.*;
import com.anonconnect.exception.AppException;
import com.anonconnect.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
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

    public DirectCallConfigResponse getDirectCallConfig(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        List<String> allowedIds = user.getDirectCallAllowedUserIds() == null ? List.of() : user.getDirectCallAllowedUserIds();
        List<String> allowedUsernames = allowedIds.stream()
                .map(id -> userRepository.findById(id).map(User::getUsername).orElse(null))
                .filter(name -> name != null && !name.isBlank())
                .collect(Collectors.toList());

        return DirectCallConfigResponse.builder()
                .enabled(Boolean.TRUE.equals(user.getDirectCallEnabled()))
                .allowedUsernames(allowedUsernames)
                .build();
    }

    public boolean canDirectCall(User caller, User callee) {
        if (caller == null || callee == null) return false;
        if (!Boolean.TRUE.equals(caller.getDirectCallEnabled()) || !Boolean.TRUE.equals(callee.getDirectCallEnabled())) {
            return false;
        }

        List<String> callerAllowed = caller.getDirectCallAllowedUserIds() == null ? List.of() : caller.getDirectCallAllowedUserIds();
        List<String> calleeAllowed = callee.getDirectCallAllowedUserIds() == null ? List.of() : callee.getDirectCallAllowedUserIds();

        return callerAllowed.contains(callee.getId()) && calleeAllowed.contains(caller.getId());
    }

    public void updateLastActive(String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastActive(Instant.now());
            userRepository.save(user);
        });
    }

    public void reportUser(String reporterId, ReportRequest request) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Reporter not found"));
        User reported = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Reported user not found"));

        Report report = Report.builder()
                .reporterId(reporterId)
                .reporterUsername(reporter.getUsername())
                .reportedId(request.getReportedUserId())
                .reportedUserId(request.getReportedUserId())
                .reportedUsername(reported.getUsername())
                .sessionId(request.getSessionId())
                .reason(request.getReason())
                .description(request.getDescription())
                .createdAt(Instant.now())
                .build();

        reportRepository.save(report);
        log.info("User {} reported user {} for: {}", reporterId, request.getReportedUserId(), request.getReason());
    }

    public void blockUser(String blockerId, String blockedId) {
        if (blockedUserRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            throw new AppException(HttpStatus.CONFLICT, "User already blocked");
        }

        if (!userRepository.existsById(blockerId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "User not found");
        }
        if (!userRepository.existsById(blockedId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "User not found");
        }

        BlockedUser block = BlockedUser.builder()
                .blockerId(blockerId)
                .blockedId(blockedId)
                .build();

        blockedUserRepository.save(block);
        log.info("User {} blocked user {}", blockerId, blockedId);
    }

    public void unblockUser(String blockerId, String blockedId) {
        blockedUserRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
        log.info("User {} unblocked user {}", blockerId, blockedId);
    }

    public List<String> getBlockedUserIds(String userId) {
        return blockedUserRepository.findByBlockerId(userId).stream()
                .map(BlockedUser::getBlockedId)
                .collect(Collectors.toList());
    }
}
