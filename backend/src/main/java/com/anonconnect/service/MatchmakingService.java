package com.anonconnect.service;

import com.anonconnect.dto.MatchPreferences;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
@Slf4j
public class MatchmakingService {

    @Nullable
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${matchmaking.queue-key}")
    private String queueKey;

    @Value("${matchmaking.use-redis:true}")
    private boolean useRedis;

    // In-memory mapping: userId -> socketId for quick lookup
    private final Map<String, String> userSocketMap = new ConcurrentHashMap<>();
    // In-memory mapping: userId -> preferences
    private final Map<String, MatchPreferences> userPreferencesMap = new ConcurrentHashMap<>();
    // In-memory queue fallback when Redis is not available
    private final ConcurrentLinkedDeque<String> inMemoryQueue = new ConcurrentLinkedDeque<>();

    public MatchmakingService(@Nullable RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void addToQueue(String userId, String socketId, MatchPreferences preferences) {
        userSocketMap.put(userId, socketId);
        if (preferences != null) {
            userPreferencesMap.put(userId, preferences);
        }
        if (useRedis && redisTemplate != null) {
            redisTemplate.opsForList().rightPush(queueKey, userId);
        } else {
            inMemoryQueue.remove(userId);
            inMemoryQueue.addLast(userId);
        }
        log.info("User {} added to matchmaking queue", userId);
    }

    public void removeFromQueue(String userId) {
        if (useRedis && redisTemplate != null) {
            redisTemplate.opsForList().remove(queueKey, 0, userId);
        } else {
            inMemoryQueue.remove(userId);
        }
        userSocketMap.remove(userId);
        userPreferencesMap.remove(userId);
        log.info("User {} removed from matchmaking queue", userId);
    }

    public Optional<String[]> findMatch(String userId) {
        List<String> queueItems;

        if (useRedis && redisTemplate != null) {
            Long queueSize = redisTemplate.opsForList().size(queueKey);
            if (queueSize == null || queueSize < 2) return Optional.empty();
            List<Object> raw = redisTemplate.opsForList().range(queueKey, 0, -1);
            queueItems = raw != null ? raw.stream().map(Object::toString).toList() : List.of();
        } else {
            if (inMemoryQueue.size() < 2) return Optional.empty();
            queueItems = new ArrayList<>(inMemoryQueue);
        }

        MatchPreferences userPrefs = userPreferencesMap.get(userId);

        for (String candidateId : queueItems) {
            if (candidateId.equals(userId)) continue;

            MatchPreferences candidatePrefs = userPreferencesMap.get(candidateId);

            if (isCompatible(userPrefs, candidatePrefs)) {
                // Remove both from queue
                if (useRedis && redisTemplate != null) {
                    redisTemplate.opsForList().remove(queueKey, 1, userId);
                    redisTemplate.opsForList().remove(queueKey, 1, candidateId);
                } else {
                    inMemoryQueue.remove(userId);
                    inMemoryQueue.remove(candidateId);
                }

                String userSocket = userSocketMap.remove(userId);
                String candidateSocket = userSocketMap.remove(candidateId);
                userPreferencesMap.remove(userId);
                userPreferencesMap.remove(candidateId);

                log.info("Match found: {} <-> {}", userId, candidateId);
                return Optional.of(new String[]{
                        userId, userSocket,
                        candidateId, candidateSocket
                });
            }
        }

        return Optional.empty();
    }

    private boolean isCompatible(MatchPreferences p1, MatchPreferences p2) {
        if (p1 == null && p2 == null) return true;
        if (p1 == null || p2 == null) return true;

        // Check gender preference: if user1 wants "female", user2's gender should match
        // Since we only have "preferredGender" (what they want to talk to), match them crosswise
        String g1 = p1.getPreferredGender();
        String g2 = p2.getPreferredGender();

        // Both have preferences — they must want the same pool (or either is null/any)
        if (g1 != null && !g1.isBlank() && g2 != null && !g2.isBlank()) {
            // Both specified a preference — only compatible if they picked each other's preference
            // e.g. user1 wants "female", user2 wants "male" → compatible
            // user1 wants "female", user2 wants "female" → not compatible (both want female)
            if (g1.equalsIgnoreCase(g2)) return false;
        }

        // Country filter
        String c1 = p1.getPreferredCountry();
        String c2 = p2.getPreferredCountry();
        if (c1 != null && !c1.isBlank() && c2 != null && !c2.isBlank()) {
            return c1.equalsIgnoreCase(c2);
        }

        return true;
    }

    public String getSocketId(String userId) {
        return userSocketMap.get(userId);
    }

    public long getQueueSize() {
        if (useRedis && redisTemplate != null) {
            Long size = redisTemplate.opsForList().size(queueKey);
            return size != null ? size : 0;
        }
        return inMemoryQueue.size();
    }
}
