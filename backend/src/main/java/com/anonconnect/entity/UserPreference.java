package com.anonconnect.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "user_preferences")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserPreference {

    @Id
    @Builder.Default
    @JsonProperty("_id")
    private String id = UUID.randomUUID().toString();

    @Indexed(unique = true)
    @JsonProperty("userId")
    private String userId;

    @JsonProperty("preferredGender")
    private String preferredGender;

    @JsonProperty("preferredCountry")
    private String preferredCountry;

    @JsonProperty("theme")
    @Builder.Default
    private String theme = "dark";

    @JsonProperty("notifications")
    @Builder.Default
    private Boolean notifications = true;

    @CreatedDate
    @JsonProperty("createdAt")
    private Instant createdAt;

    @LastModifiedDate
    @JsonProperty("updatedAt")
    private Instant updatedAt;
}
