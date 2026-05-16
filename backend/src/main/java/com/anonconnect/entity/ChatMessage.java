package com.anonconnect.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "chat_messages")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @Builder.Default
    @JsonProperty("_id")
    private String id = UUID.randomUUID().toString();

    @JsonProperty("sessionId")
    private String sessionId;

    @JsonProperty("senderId")
    private String senderId;

    @JsonProperty("content")
    private String content;

    @JsonProperty("messageType")
    @Builder.Default
    private String messageType = "TEXT";

    @CreatedDate
    @JsonProperty("createdAt")
    private Instant createdAt;
}
