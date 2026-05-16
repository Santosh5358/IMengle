package com.anonconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_preferences")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "preferred_gender", length = 20)
    private String preferredGender;

    @Column(name = "preferred_country", length = 3)
    private String preferredCountry;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String theme = "dark";

    @Column(nullable = false)
    @Builder.Default
    private Boolean notifications = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
