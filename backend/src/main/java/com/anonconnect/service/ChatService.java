package com.anonconnect.service;

import com.anonconnect.entity.ChatMessage;
import com.anonconnect.entity.ChatSession;
import com.anonconnect.entity.User;
import com.anonconnect.exception.AppException;
import com.anonconnect.repository.ChatMessageRepository;
import com.anonconnect.repository.ChatSessionRepository;
import com.anonconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatSession createSession(UUID callerId, UUID receiverId) {
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Caller not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Receiver not found"));

        ChatSession session = ChatSession.builder()
                .caller(caller)
                .receiver(receiver)
                .status("ACTIVE")
                .build();

        session = chatSessionRepository.save(session);
        log.info("Chat session created: {} between {} and {}", session.getId(), callerId, receiverId);
        return session;
    }

    @Transactional
    public void endSession(UUID sessionId) {
        chatSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setStatus("ENDED");
            session.setEndTime(Instant.now());
            session.setDurationSecs(
                    (int) Duration.between(session.getStartTime(), Instant.now()).getSeconds());
            chatSessionRepository.save(session);
            log.info("Chat session ended: {}", sessionId);
        });
    }

    @Transactional
    public ChatMessage saveMessage(UUID sessionId, UUID senderId, String content, String type) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Session not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sender not found"));

        ChatMessage message = ChatMessage.builder()
                .session(session)
                .sender(sender)
                .content(content)
                .messageType(type != null ? type : "TEXT")
                .build();

        return chatMessageRepository.save(message);
    }

    public Page<ChatMessage> getSessionMessages(UUID sessionId, Pageable pageable) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId, pageable);
    }
}
