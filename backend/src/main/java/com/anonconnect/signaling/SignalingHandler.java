package com.anonconnect.signaling;

import com.anonconnect.dto.MatchPreferences;
import com.anonconnect.entity.ActiveConnection;
import com.anonconnect.entity.User;
import com.anonconnect.repository.ActiveConnectionRepository;
import com.anonconnect.repository.UserRepository;
import com.anonconnect.service.ChatService;
import com.anonconnect.service.MatchmakingService;
import com.anonconnect.service.UserService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@ConditionalOnProperty(name = "socketio.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class SignalingHandler {

    private final SocketIOServer server;
    private final MatchmakingService matchmakingService;
    private final ChatService chatService;
    private final UserService userService;
    private final ActiveConnectionRepository activeConnectionRepository;
    private final UserRepository userRepository;

    // Active session tracking: sessionId -> [userId1, userId2]
    private final Map<String, String[]> activeSessions = new ConcurrentHashMap<>();
    // User -> current session mapping
    private final Map<String, String> userSessionMap = new ConcurrentHashMap<>();
    // Socket -> userId mapping
    private final Map<UUID, String> socketUserMap = new ConcurrentHashMap<>();
    // Pending direct calls: callId -> call state
    private final Map<String, PendingDirectCall> pendingDirectCalls = new ConcurrentHashMap<>();

    @PostConstruct
    public void start() {
        server.addConnectListener(onConnect());
        server.addDisconnectListener(onDisconnect());

        // Matchmaking events
        server.addEventListener("join-queue", Map.class, onJoinQueue());
        server.addEventListener("leave-queue", String.class, onLeaveQueue());

        // Direct call events
        server.addEventListener("direct-call", Map.class, onDirectCall());
        server.addEventListener("accept-call", Map.class, onAcceptCall());
        server.addEventListener("reject-call", Map.class, onRejectCall());

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
                clearPendingCallsForUser(userId);
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
    private DataListener<Map> onDirectCall() {
        return (client, data, ackRequest) -> {
            String callerId = socketUserMap.get(client.getSessionId());
            if (callerId == null) return;

            String targetUsername = data == null ? null : (String) data.get("targetUsername");
            if (targetUsername == null || targetUsername.isBlank()) {
                client.sendEvent("direct-call-failed", Map.of("message", "Target username is required"));
                return;
            }

            Optional<User> callerOpt = userRepository.findById(callerId);
            Optional<User> calleeOpt = userRepository.findByUsername(targetUsername.trim());
            if (callerOpt.isEmpty() || calleeOpt.isEmpty()) {
                client.sendEvent("direct-call-failed", Map.of("message", "Target user not found"));
                return;
            }

            User caller = callerOpt.get();
            User callee = calleeOpt.get();

            if (caller.getId().equals(callee.getId())) {
                client.sendEvent("direct-call-failed", Map.of("message", "You cannot call yourself"));
                return;
            }

            if (!userService.canDirectCall(caller, callee)) {
                client.sendEvent("direct-call-failed", Map.of("message", "Direct call is not enabled for this pair"));
                return;
            }

            if (userSessionMap.containsKey(caller.getId()) || userSessionMap.containsKey(callee.getId())) {
                client.sendEvent("direct-call-failed", Map.of("message", "One of the users is already in a call"));
                return;
            }

            SocketIOClient calleeClient = findClientByUserId(callee.getId());
            if (calleeClient == null) {
                client.sendEvent("direct-call-failed", Map.of("message", "Target user is offline"));
                return;
            }

            String callId = UUID.randomUUID().toString();
            PendingDirectCall pending = new PendingDirectCall(
                    callId,
                    caller.getId(),
                    caller.getUsername(),
                    client.getSessionId().toString(),
                    callee.getId(),
                    callee.getUsername(),
                    calleeClient.getSessionId().toString()
            );
            pendingDirectCalls.put(callId, pending);

            calleeClient.sendEvent("incoming-call", Map.of(
                    "callId", callId,
                    "fromUserId", caller.getId(),
                    "fromUsername", caller.getUsername()
            ));

            client.sendEvent("call-ringing", Map.of(
                    "callId", callId,
                    "toUsername", callee.getUsername()
            ));
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Map> onAcceptCall() {
        return (client, data, ackRequest) -> {
            String calleeId = socketUserMap.get(client.getSessionId());
            if (calleeId == null) return;

            String callId = data == null ? null : (String) data.get("callId");
            if (callId == null || callId.isBlank()) return;

            PendingDirectCall pending = pendingDirectCalls.remove(callId);
            if (pending == null || !pending.calleeId().equals(calleeId)) {
                return;
            }

            SocketIOClient callerClient = getClientBySocketId(pending.callerSocketId());
            SocketIOClient calleeClient = getClientBySocketId(pending.calleeSocketId());
            if (callerClient == null || calleeClient == null) {
                if (callerClient != null) {
                    callerClient.sendEvent("call-rejected", Map.of("callId", callId, "reason", "User unavailable"));
                }
                return;
            }

            if (userSessionMap.containsKey(pending.callerId()) || userSessionMap.containsKey(pending.calleeId())) {
                callerClient.sendEvent("direct-call-failed", Map.of("message", "One of the users is already in a call"));
                return;
            }

            matchmakingService.removeFromQueue(pending.callerId());
            matchmakingService.removeFromQueue(pending.calleeId());

            callerClient.sendEvent("call-accepted", Map.of("callId", callId));
            initiateMatch(new String[]{
                    pending.callerId(), pending.callerSocketId(),
                    pending.calleeId(), pending.calleeSocketId()
            });
        };
    }

    @SuppressWarnings("unchecked")
    private DataListener<Map> onRejectCall() {
        return (client, data, ackRequest) -> {
            String calleeId = socketUserMap.get(client.getSessionId());
            if (calleeId == null) return;

            String callId = data == null ? null : (String) data.get("callId");
            if (callId == null || callId.isBlank()) return;

            PendingDirectCall pending = pendingDirectCalls.remove(callId);
            if (pending == null || !pending.calleeId().equals(calleeId)) {
                return;
            }

            SocketIOClient callerClient = getClientBySocketId(pending.callerSocketId());
            if (callerClient != null) {
                callerClient.sendEvent("call-rejected", Map.of(
                        "callId", callId,
                        "byUsername", pending.calleeUsername()
                ));
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

            // Forward to peer using socketUserMap (always has connected users)
            String[] sessionUsers = activeSessions.get(sessionId);
            if (sessionUsers != null) {
                String peerId = sessionUsers[0].equals(userId) ? sessionUsers[1] : sessionUsers[0];
                SocketIOClient peer = findClientByUserId(peerId);
                if (peer != null) {
                    peer.sendEvent("chat-message", Map.of(
                            "content", content,
                            "senderId", userId,
                            "timestamp", Instant.now().toString()
                    ));
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
                // End current session and notify peer to auto-search
                String sessionId = userSessionMap.remove(userId);
                if (sessionId != null) {
                    String[] sessionUsers = activeSessions.remove(sessionId);
                    if (sessionUsers != null) {
                        chatService.endSession(sessionId);
                        String peerId = sessionUsers[0].equals(userId) ? sessionUsers[1] : sessionUsers[0];
                        userSessionMap.remove(peerId);

                        // Notify peer and auto-re-queue them
                        SocketIOClient peer = findClientByUserId(peerId);
                        if (peer != null) {
                            peer.sendEvent("peer-next");
                            matchmakingService.addToQueue(peerId, peer.getSessionId().toString(), null);
                            peer.sendEvent("searching");
                            // Try to find a match for the peer too
                            matchmakingService.findMatch(peerId).ifPresent(this::initiateMatch);
                        }
                    }
                }

                // Re-add current user to queue
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

        // Lookup usernames for display
        String username1 = userRepository.findById(userId1).map(u -> u.getUsername()).orElse("Stranger");
        String username2 = userRepository.findById(userId2).map(u -> u.getUsername()).orElse("Stranger");

        if (client1 != null) {
            client1.sendEvent("match-found", Map.of(
                    "sessionId", sessionId,
                    "peerId", userId2,
                    "peerSocketId", socketId2,
                    "peerName", username2,
                    "initiator", true
            ));
        }

        if (client2 != null) {
            client2.sendEvent("match-found", Map.of(
                    "sessionId", sessionId,
                    "peerId", userId1,
                    "peerSocketId", socketId1,
                    "peerName", username1,
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
                SocketIOClient peer = findClientByUserId(peerId);
                if (peer != null) {
                    peer.sendEvent("peer-disconnected");
                }
            }
        }
    }

    private SocketIOClient findClientByUserId(String targetUserId) {
        for (Map.Entry<UUID, String> entry : socketUserMap.entrySet()) {
            if (entry.getValue().equals(targetUserId)) {
                return server.getClient(entry.getKey());
            }
        }
        return null;
    }

    private SocketIOClient getClientBySocketId(String socketId) {
        try {
            return server.getClient(UUID.fromString(socketId));
        } catch (IllegalArgumentException ex) {
            return null;
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
        SocketIOClient peer = findClientByUserId(peerId);
        if (peer != null) {
            peer.sendEvent(event, data);
        }
    }

    private void broadcastOnlineCount() {
        int count = socketUserMap.size();
        server.getBroadcastOperations().sendEvent("online-count", Map.of("count", count));
    }

    private void clearPendingCallsForUser(String userId) {
        pendingDirectCalls.entrySet().removeIf(entry -> {
            PendingDirectCall call = entry.getValue();
            if (!call.callerId().equals(userId) && !call.calleeId().equals(userId)) {
                return false;
            }

            String otherSocketId = call.callerId().equals(userId) ? call.calleeSocketId() : call.callerSocketId();
            SocketIOClient otherClient = getClientBySocketId(otherSocketId);
            if (otherClient != null) {
                otherClient.sendEvent("call-rejected", Map.of(
                        "callId", call.callId(),
                        "reason", "User unavailable"
                ));
            }
            return true;
        });
    }

    private record PendingDirectCall(
            String callId,
            String callerId,
            String callerUsername,
            String callerSocketId,
            String calleeId,
            String calleeUsername,
            String calleeSocketId
    ) {}
}
