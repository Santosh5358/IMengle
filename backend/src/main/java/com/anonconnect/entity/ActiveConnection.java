package com.anonconnect.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "active_connections")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ActiveConnection {

    @Id
    @Builder.Default
    @JsonProperty("_id")
    private String id = UUID.randomUUID().toString();

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("socketId")
    private String socketId;

    @JsonProperty("ipAddress")
    private String ipAddress;

    @JsonProperty("connectedAt")
    @Builder.Default
    private Instant connectedAt = Instant.now();

    @JsonProperty("lastPing")
    @Builder.Default
    private Instant lastPing = Instant.now();
}
