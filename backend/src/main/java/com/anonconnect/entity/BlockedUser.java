package com.anonconnect.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "blocked_users")
@CompoundIndexes({
    @CompoundIndex(name = "blocker_blocked_idx", def = "{'blockerId': 1, 'blockedId': 1}", unique = true)
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BlockedUser {

    @Id
    @Builder.Default
    @JsonProperty("_id")
    private String id = UUID.randomUUID().toString();

    @JsonProperty("blockerId")
    private String blockerId;

    @JsonProperty("blockedId")
    private String blockedId;

    @CreatedDate
    @JsonProperty("createdAt")
    private Instant createdAt;
}
