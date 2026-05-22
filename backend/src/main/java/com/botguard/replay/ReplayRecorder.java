package com.botguard.replay;

import com.botguard.model.EnvelopeEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class ReplayRecorder {
    private static final Logger log = LoggerFactory.getLogger(ReplayRecorder.class);
    private static final long REPLAY_TTL_SECONDS = 86400; // 24h
    private static final long MAXLEN = 10000;

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public ReplayRecorder(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    public void record(EnvelopeEvent event) {
        try {
            String sessionId = event.getSessionId();
            if (sessionId == null) return;

            String listKey = "replay:list:" + sessionId;

            Map<String, Object> record = Map.of(
                    "type", event.getType().name(),
                    "timestamp", event.getTimestamp().toString(),
                    "severity", event.getSeverity().name(),
                    "payload", event.getPayload(),
                    "metadata", event.getMetadata() != null ? event.getMetadata() : Map.of()
            );

            String json = objectMapper.writeValueAsString(record);
            redis.opsForList().rightPush(listKey, json);
            redis.expire(listKey, REPLAY_TTL_SECONDS, TimeUnit.SECONDS);

            redis.opsForZSet().add("replay:index", sessionId, System.currentTimeMillis());
            redis.expire("replay:index", REPLAY_TTL_SECONDS, TimeUnit.SECONDS);

        } catch (Exception e) {
            log.error("Failed to record replay event: {}", e.getMessage());
        }
    }
}
