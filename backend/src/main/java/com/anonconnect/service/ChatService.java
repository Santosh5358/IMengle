package com.anonconnect.service;

import com.anonconnect.entity.ChatMessage;
import com.anonconnect.entity.ChatSession;
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

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public ChatSession createSession(String callerId, String receiverId) {
        if (!userRepository.existsById(callerId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Caller not found");
        }
        if (!userRepository.existsById(receiverId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Receiver not found");
        }

        ChatSession session = ChatSession.builder()
                .callerId(callerId)
                .receiverId(receiverId)
                .status("ACTIVE")
                .build();

        session = chatSessionRepository.save(session);
        log.info("Chat session created: {} between {} and {}", session.getId(), callerId, receiverId);
        return session;
    }

    public void endSession(String sessionId) {
        chatSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setStatus("ENDED");
            session.setEndTime(Instant.now());
            session.setDurationSecs(
                    (int) Duration.between(session.getStartTime(), Instant.now()).getSeconds());
            chatSessionRepository.save(session);
            log.info("Chat session ended: {}", sessionId);
        });
    }

    public ChatMessage saveMessage(String sessionId, String senderId, String content, String type) {
        if (!chatSessionRepository.existsById(sessionId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Session not found");
        }
        if (!userRepository.existsById(senderId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Sender not found");
        }

        ChatMessage message = ChatMessage.builder()
                .sessionId(sessionId)
                .senderId(senderId)
                .content(content)
                .messageType(type != null ? type : "TEXT")
                .build();

        return chatMessageRepository.save(message);
    }

    public Page<ChatMessage> getSessionMessages(String sessionId, Pageable pageable) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId, pageable);
    }
}
