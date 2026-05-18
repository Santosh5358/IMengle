package com.anonconnect.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "reports")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Report {

    @Id
    @Builder.Default
    @JsonProperty("_id")
    private String id = UUID.randomUUID().toString();

    @JsonProperty("reporterId")
    private String reporterId;

    @JsonProperty("reporterUsername")
    private String reporterUsername;

    @JsonProperty("reportedId")
    private String reportedId;

    // Backward compatibility for older records saved with a different field name.
    @JsonProperty("reportedUserId")
    private String reportedUserId;

    @JsonProperty("reportedUsername")
    private String reportedUsername;

    @JsonProperty("sessionId")
    private String sessionId;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("description")
    private String description;

    @JsonProperty("status")
    @Builder.Default
    private String status = "PENDING";

    @JsonProperty("reviewedById")
    private String reviewedById;

    @JsonProperty("reviewedAt")
    private Instant reviewedAt;

    @CreatedDate
    @JsonProperty("createdAt")
    private Instant createdAt;
}
