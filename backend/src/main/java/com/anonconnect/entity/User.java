package com.anonconnect.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Document(collection = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @Builder.Default
    @JsonProperty("_id")
    private String id = UUID.randomUUID().toString();

    @JsonProperty("username")
    private String username;

    @JsonProperty("passwordHash")
    private String passwordHash;

    @JsonProperty("email")
    private String email;

    @JsonProperty("country")
    private String country;

    @JsonProperty("gender")
    private String gender;

    @JsonProperty("avatarUrl")
    private String avatarUrl;

    @JsonProperty("role")
    @Builder.Default
    private String role = "USER";

    @JsonProperty("isBanned")
    @Builder.Default
    private Boolean isBanned = false;

    @JsonProperty("directCallEnabled")
    @Builder.Default
    private Boolean directCallEnabled = false;

    @JsonProperty("directCallAllowedUserIds")
    @Builder.Default
    private List<String> directCallAllowedUserIds = new ArrayList<>();

    @JsonProperty("banReason")
    private String banReason;

    @JsonProperty("lastActive")
    private Instant lastActive;

    @CreatedDate
    @JsonProperty("createdAt")
    private Instant createdAt;

    @LastModifiedDate
    @JsonProperty("updatedAt")
    private Instant updatedAt;
}
