package com.anonconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @Builder @AllArgsConstructor
public class DashboardStats {
    private long totalUsers;
    private long onlineUsers;
    private long activeSocketConnections;
    private long activeSessions;
    private long pendingReports;
    private long bannedUsers;
    private long totalSessionsToday;
}
