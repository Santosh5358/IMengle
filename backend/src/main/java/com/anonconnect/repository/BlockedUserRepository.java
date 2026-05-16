package com.anonconnect.repository;

import com.anonconnect.entity.BlockedUser;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlockedUserRepository extends MongoRepository<BlockedUser, String> {
    boolean existsByBlockerIdAndBlockedId(String blockerId, String blockedId);
    List<BlockedUser> findByBlockerId(String blockerId);
    void deleteByBlockerIdAndBlockedId(String blockerId, String blockedId);
}
