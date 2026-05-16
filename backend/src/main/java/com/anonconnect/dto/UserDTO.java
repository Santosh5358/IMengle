package com.anonconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data @Builder @AllArgsConstructor
public class UserDTO {
    private String id;
    private String username;
    private String country;
    private String gender;
    private String avatarUrl;
    private String role;
    private Boolean isBanned;
    private Instant lastActive;
    private Instant createdAt;
}
