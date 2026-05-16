package com.anonconnect.repository;

import com.anonconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    @Query("SELECT COUNT(u) FROM User u WHERE u.isBanned = false")
    long countActiveUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.lastActive > :since")
    long countUsersActiveSince(Instant since);

    @Query("SELECT COUNT(u) FROM User u WHERE u.isBanned = true")
    long countBannedUsers();
}
