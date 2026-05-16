package com.anonconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "active_connections")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ActiveConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "socket_id", nullable = false, length = 100)
    private String socketId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "connected_at", nullable = false)
    @Builder.Default
    private Instant connectedAt = Instant.now();

    @Column(name = "last_ping", nullable = false)
    @Builder.Default
    private Instant lastPing = Instant.now();
}
