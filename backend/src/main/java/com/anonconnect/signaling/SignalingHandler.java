package com.anonconnect.signaling;

import com.anonconnect.dto.MatchPreferences;
import com.anonconnect.entity.ActiveConnection;
import com.anonconnect.repository.ActiveConnectionRepository;
import com.anonconnect.repository.UserRepository;
import com.anonconnect.service.ChatService;
import com.anonconnect.service.MatchmakingService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class SignalingHandler {

    private final SocketIOServer server;
    private final MatchmakingService matchmakingService;
    private final ChatService chatService;
    private final ActiveConnectionRepository activeConnectionRepository;
    private final UserRepository userRepository;

    // Active session tracking: sessionId -> [userId1, userId2]
    private final Map<String, String[]> activeSessions = new ConcurrentHashMap<>();
    // User -> current session mapping
    private final Map<String, String> userSessionMap = new ConcurrentHashMap<>();
    // Socket -> userId mapping
    private final Map<UUID, String> socketUserMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void start() {
        server.addConnectListener(onConnect());
        server.addDisconnectListener(onDisconnect());

        // Matchmaking events
        server.addEventListener("join-queue", Map.class, onJoinQueue());
        server.addEventListener("leave-queue", String.class, onLeaveQueue());

        // WebRTC signaling events
        server.addEventListener("offer", Map.class, onOffer());
        server.addEventListener("answer", Map.class, onAnswer());
        server.addEventListener("ice-candidate", Map.class, onIceCandidate());

        // Chat events
        server.addEventListener("chat-message", Map.class, onChatMessage());
        server.addEventListener("typing", Map.class, onTyping());
        server.addEventListener("stop-typing", Map.class, onStopTyping());

        // Control events
        server.addEventListener("next", String.class, onNext());
        server.addEventListener("end-session", String.class, onEndSession());

        server.start();
        log.info("Socket.IO signaling server started on port {}", server.getConfiguration().getPort());
    }

    @PreDestroy
    public void stop() {
        server.stop();
        log.info("Socket.IO signaling server stopped");
    }

    private ConnectListener onConnect() {
        return client -> {
            String userId = client.getHandshakeData().getSingleUrlParam("userId");
            if (userId != null) {
                socketUserMap.put(client.getSessionId(), userId);

                // Register active connection
                if (userRepository.existsById(userId)) {
                    ActiveConnection conn = ActiveConnection.builder()
                            .userId(userId)
                            .socketId(client.getSessionId().toString())
                            .ipAddress(client.getHandshakeData().getAddress().getHostString())
                            .build();
                    activeConnectionRepository.save(conn);
                }

                log.info("Client connected: {} (user: {})", client.getSessionId(), userId);
            }

            // Broadcast online count
            broadcastOnlineCount();
        };
    }

    private DisconnectListener onDisconnect() {
        return client -> {
            String userId = socketUserMap.remove(client.getSessionId());
            if (userId != null) {
                matchmakingService.removeFromQueue(userId);
                handleUserDisconnect(userId);
                activeConnectionRepository.deleteBySocketId(client.getSessionId().toString());
            }
            broadcastOnlineCount();
            log.info("Client disconnected: {}", client.getSessionId());
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Map> onJoinQueue() {
        return (client, data, ackRequest) -> {
            String userId = socketUserMap.get(client.getSessionId());
            if (userId == null) return;

            MatchPreferences prefs = new MatchPreferences();
            if (data != null) {
                prefs.setPreferredGender((String) data.get("preferredGender"));
                prefs.setPreferredCountry((String) data.get("preferredCountry"));
            }

            matchmakingService.addToQueue(userId, client.getSessionId().toString(), prefs);
            client.sendEvent("queue-joined", Map.of("position", matchmakingService.getQueueSize()));

            // Try to find a match immediately
            Optional<String[]> match = matchmakingService.findMatch(userId);
            match.ifPresent(this::initiateMatch);
        };
    }

    private DataListener<String> onLeaveQueue() {
        return (client, data, ackRequest) -> {
            String userId = socketUserMap.get(client.getSessionId());
            if (userId != null) {
                matchmakingService.removeFromQueue(userId);
                client.sendEvent("queue-left");
            }
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Map> onOffer() {
        return (client, data, ackRequest) -> {
            String targetSocketId = (String) data.get("targetSocketId");
            if (targetSocketId != null) {
                SocketIOClient target = server.getClient(UUID.fromString(targetSocketId));
                if (target != null) {
                    target.sendEvent("offer", Map.of(
                            "sdp", data.get("sdp"),
                            "fromSocketId", client.getSessionId().toString()
                    ));
                }
            }
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Map> onAnswer() {
        return (client, data, ackRequest) -> {
            String targetSocketId = (String) data.get("targetSocketId");
            if (targetSocketId != null) {
                SocketIOClient target = server.getClient(UUID.fromString(targetSocketId));
                if (target != null) {
                    target.sendEvent("answer", Map.of(
                            "sdp", data.get("sdp"),
                            "fromSocketId", client.getSessionId().toString()
                    ));
                }
            }
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Map> onIceCandidate() {
        return (client, data, ackRequest) -> {
            String targetSocketId = (String) data.get("targetSocketId");
            if (targetSocketId != null) {
                SocketIOClient target = server.getClient(UUID.fromString(targetSocketId));
                if (target != null) {
                    target.sendEvent("ice-candidate", Map.of(
                            "candidate", data.get("candidate"),
                            "fromSocketId", client.getSessionId().toString()
                    ));
                }
            }
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Map> onChatMessage() {
        return (client, data, ackRequest) -> {
            String userId = socketUserMap.get(client.getSessionId());
            String sessionId = userSessionMap.get(userId);
            if (sessionId == null || userId == null) return;

            String content = (String) data.get("content");
            if (content == null || content.isBlank()) return;

            // Persist message
            chatService.saveMessage(sessionId, userId, content, "TEXT");

            // Forward to peer
            String[] sessionUsers = activeSessions.get(sessionId);
            if (sessionUsers != null) {
                String peerId = sessionUsers[0].equals(userId) ? sessionUsers[1] : sessionUsers[0];
                String peerSocketId = matchmakingService.getSocketId(peerId);
                // The peer might not be in the queue map; check active connections
                if (peerSocketId == null) {
                    activeConnectionRepository.findByUserId(peerId)
                            .ifPresent(conn -> {
                                SocketIOClient peer = server.getClient(UUID.fromString(conn.getSocketId()));
                                if (peer != null) {
                                    peer.sendEvent("chat-message", Map.of(
                                            "content", content,
                                            "senderId", userId,
                                            "timestamp", Instant.now().toString()
                                    ));
                                }
                            });
                } else {
                    SocketIOClient peer = server.getClient(UUID.fromString(peerSocketId));
                    if (peer != null) {
                        peer.sendEvent("chat-message", Map.of(
                                "content", content,
                                "senderId", userId,
                                "timestamp", Instant.now().toString()
                        ));
                    }
                }
            }
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Map> onTyping() {
        return (client, data, ackRequest) -> {
            forwardToPeer(client, "typing", Map.of("userId", socketUserMap.getOrDefault(client.getSessionId(), "")));
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Map> onStopTyping() {
        return (client, data, ackRequest) -> {
            forwardToPeer(client, "stop-typing", Map.of("userId", socketUserMap.getOrDefault(client.getSessionId(), "")));
        };
    }

    private DataListener<String> onNext() {
        return (client, data, ackRequest) -> {
            String userId = socketUserMap.get(client.getSessionId());
            if (userId != null) {
                handleUserDisconnect(userId);
                // Re-add to queue
                matchmakingService.addToQueue(userId, client.getSessionId().toString(), null);
                client.sendEvent("searching");

                Optional<String[]> match = matchmakingService.findMatch(userId);
                match.ifPresent(this::initiateMatch);
            }
        };
    }

    private DataListener<String> onEndSession() {
        return (client, data, ackRequest) -> {
            String userId = socketUserMap.get(client.getSessionId());
            if (userId != null) {
                handleUserDisconnect(userId);
                client.sendEvent("session-ended");
            }
        };
    }

    private void initiateMatch(String[] matchData) {
        String userId1 = matchData[0];
        String socketId1 = matchData[1];
        String userId2 = matchData[2];
        String socketId2 = matchData[3];

        // Create chat session
        var session = chatService.createSession(userId1, userId2);
        String sessionId = session.getId();

        activeSessions.put(sessionId, new String[]{userId1, userId2});
        userSessionMap.put(userId1, sessionId);
        userSessionMap.put(userId2, sessionId);

        SocketIOClient client1 = server.getClient(UUID.fromString(socketId1));
        SocketIOClient client2 = server.getClient(UUID.fromString(socketId2));

        if (client1 != null) {
            client1.sendEvent("match-found", Map.of(
                    "sessionId", sessionId,
                    "peerId", userId2,
                    "peerSocketId", socketId2,
                    "initiator", true
            ));
        }

        if (client2 != null) {
            client2.sendEvent("match-found", Map.of(
                    "sessionId", sessionId,
                    "peerId", userId1,
                    "peerSocketId", socketId1,
                    "initiator", false
            ));
        }

        log.info("Match initiated: session={}, users=[{}, {}]", sessionId, userId1, userId2);
    }

    private void handleUserDisconnect(String userId) {
        String sessionId = userSessionMap.remove(userId);
        if (sessionId != null) {
            String[] sessionUsers = activeSessions.remove(sessionId);
            if (sessionUsers != null) {
                chatService.endSession(sessionId);
                String peerId = sessionUsers[0].equals(userId) ? sessionUsers[1] : sessionUsers[0];
                userSessionMap.remove(peerId);

                // Notify peer
                activeConnectionRepository.findByUserId(peerId)
                        .ifPresent(conn -> {
                            SocketIOClient peer = server.getClient(UUID.fromString(conn.getSocketId()));
                            if (peer != null) {
                                peer.sendEvent("peer-disconnected");
                            }
                        });
            }
        }
    }

    private void forwardToPeer(SocketIOClient client, String event, Map<String, Object> data) {
        String userId = socketUserMap.get(client.getSessionId());
        if (userId == null) return;

        String sessionId = userSessionMap.get(userId);
        if (sessionId == null) return;

        String[] sessionUsers = activeSessions.get(sessionId);
        if (sessionUsers == null) return;

        String peerId = sessionUsers[0].equals(userId) ? sessionUsers[1] : sessionUsers[0];
        activeConnectionRepository.findByUserId(peerId)
                .ifPresent(conn -> {
                    SocketIOClient peer = server.getClient(UUID.fromString(conn.getSocketId()));
                    if (peer != null) {
                        peer.sendEvent(event, data);
                    }
                });
    }

    private void broadcastOnlineCount() {
        long count = activeConnectionRepository.count();
        server.getBroadcastOperations().sendEvent("online-count", Map.of("count", count));
    }
}
