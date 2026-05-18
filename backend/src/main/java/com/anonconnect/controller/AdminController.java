package com.anonconnect.controller;

import com.anonconnect.dto.ApiResponse;
import com.anonconnect.dto.DashboardStats;
import com.anonconnect.dto.DirectCallAccessDTO;
import com.anonconnect.dto.DirectCallAccessRequest;
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

import java.util.List;

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
            @PathVariable String reportId,
            @RequestParam String action,
            Authentication auth) {
        String adminId = auth.getName();
        adminService.resolveReport(reportId, adminId, action);
        return ResponseEntity.ok(ApiResponse.ok("Report resolved", null));
    }

    @PostMapping("/ban/{userId}")
    public ResponseEntity<ApiResponse<Void>> banUser(@PathVariable String userId, @RequestParam String reason) {
        adminService.banUser(userId, reason);
        return ResponseEntity.ok(ApiResponse.ok("User banned", null));
    }

    @PostMapping("/unban/{userId}")
    public ResponseEntity<ApiResponse<Void>> unbanUser(@PathVariable String userId) {
        adminService.unbanUser(userId);
        return ResponseEntity.ok(ApiResponse.ok("User unbanned", null));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserDTO>>> getUsers(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers(pageable)));
    }

    @GetMapping("/direct-call/access")
    public ResponseEntity<ApiResponse<List<DirectCallAccessDTO>>> getDirectCallAccess() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getDirectCallAccessList()));
    }

    @PostMapping("/direct-call/access")
    public ResponseEntity<ApiResponse<DirectCallAccessDTO>> updateDirectCallAccess(@RequestBody DirectCallAccessRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Direct call access updated", adminService.updateDirectCallAccess(request)));
    }
}
