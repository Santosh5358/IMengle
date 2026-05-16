package com.anonconnect.repository;

import com.anonconnect.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {

    Page<ChatSession> findByCallerIdOrReceiverId(UUID callerId, UUID receiverId, Pageable pageable);

    @Query("SELECT COUNT(s) FROM ChatSession s WHERE s.status = 'ACTIVE'")
    long countActiveSessions();

    @Query("SELECT COUNT(s) FROM ChatSession s WHERE s.startTime > :since")
    long countSessionsSince(Instant since);
}
