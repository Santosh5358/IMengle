package com.anonconnect.controller;

import com.anonconnect.dto.ApiResponse;
import com.anonconnect.dto.DashboardStats;
import com.anonconnect.dto.UserDTO;
import com.anonconnect.entity.Report;
import com.anonconnect.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getDashboardStats()));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<Page<Report>>> getReports(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getPendingReports(pageable)));
    }

    @PostMapping("/reports/{reportId}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolveReport(
            @PathVariable UUID reportId,
            @RequestParam String action,
            Authentication auth) {
        UUID adminId = UUID.fromString(auth.getName());
        adminService.resolveReport(reportId, adminId, action);
        return ResponseEntity.ok(ApiResponse.ok("Report resolved", null));
    }

    @PostMapping("/ban/{userId}")
    public ResponseEntity<ApiResponse<Void>> banUser(@PathVariable UUID userId, @RequestParam String reason) {
        adminService.banUser(userId, reason);
        return ResponseEntity.ok(ApiResponse.ok("User banned", null));
    }

    @PostMapping("/unban/{userId}")
    public ResponseEntity<ApiResponse<Void>> unbanUser(@PathVariable UUID userId) {
        adminService.unbanUser(userId);
        return ResponseEntity.ok(ApiResponse.ok("User unbanned", null));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserDTO>>> getUsers(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers(pageable)));
    }
}
