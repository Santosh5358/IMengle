package com.anonconnect.controller;

import com.anonconnect.dto.ApiResponse;
import com.anonconnect.dto.ReportRequest;
import com.anonconnect.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getOnlineCount() {
        long count = userService.getOnlineUserCount();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("online", count)));
    }

    @PostMapping("/report")
    public ResponseEntity<ApiResponse<Void>> reportUser(
            Authentication auth,
            @Valid @RequestBody ReportRequest request) {
        String userId = auth.getName();
        userService.reportUser(userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Report submitted", null));
    }

    @PostMapping("/block/{targetId}")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            Authentication auth,
            @PathVariable String targetId) {
        String userId = auth.getName();
        userService.blockUser(userId, targetId);
        return ResponseEntity.ok(ApiResponse.ok("User blocked", null));
    }

    @DeleteMapping("/block/{targetId}")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            Authentication auth,
            @PathVariable String targetId) {
        String userId = auth.getName();
        userService.unblockUser(userId, targetId);
        return ResponseEntity.ok(ApiResponse.ok("User unblocked", null));
    }
}
