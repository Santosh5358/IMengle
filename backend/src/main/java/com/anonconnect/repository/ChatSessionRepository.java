package com.anonconnect.repository;

import com.anonconnect.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface ChatSessionRepository extends MongoRepository<ChatSession, String> {

    Page<ChatSession> findByCallerIdOrReceiverId(String callerId, String receiverId, Pageable pageable);

    long countByStatus(String status);

    long countByStartTimeGreaterThan(Instant since);
}
