package com.anonconnect.repository;

import com.anonconnect.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    @Query("{'isBanned': false}")
    long countActiveUsers();

    @Query("{'lastActive': {$gt: ?0}}")
    long countUsersActiveSince(Instant since);

    @Query("{'isBanned': true}")
    long countBannedUsers();
}
