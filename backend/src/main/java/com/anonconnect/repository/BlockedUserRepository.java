package com.anonconnect.repository;

import com.anonconnect.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, UUID> {
    boolean existsByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);
    List<BlockedUser> findByBlockerId(UUID blockerId);
    @Modifying @Transactional
    void deleteByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);
}
