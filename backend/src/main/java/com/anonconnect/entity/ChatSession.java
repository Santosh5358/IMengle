package com.anonconnect.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "chat_sessions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatSession {

    @Id
    @Builder.Default
    @JsonProperty("_id")
    private String id = UUID.randomUUID().toString();

    @JsonProperty("callerId")
    private String callerId;

    @JsonProperty("receiverId")
    private String receiverId;

    @JsonProperty("status")
    @Builder.Default
    private String status = "ACTIVE";

    @JsonProperty("startTime")
    @Builder.Default
    private Instant startTime = Instant.now();

    @JsonProperty("endTime")
    private Instant endTime;

    @JsonProperty("durationSecs")
    private Integer durationSecs;

    @CreatedDate
    @JsonProperty("createdAt")
    private Instant createdAt;
}
