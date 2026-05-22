package com.botguard.replay;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReplayService {
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public ReplayService(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getSessionReplay(String sessionId) {
        String listKey = "replay:list:" + sessionId;
        List<Map<String, Object>> records = new ArrayList<>();

        List<String> rawEntries = redis.opsForList().range(listKey, 0, -1);
        if (rawEntries != null) {
            int seq = 1;
            for (String raw : rawEntries) {
                try {
                    Map<String, Object> record = objectMapper.readValue(raw, new TypeReference<>() {});
                    record.put("seq", seq++);
                    records.add(record);
                } catch (Exception e) {
                    Map<String, Object> fallback = new HashMap<>();
                    fallback.put("seq", seq++);
                    fallback.put("raw", raw);
                    records.add(fallback);
                }
            }
        }

        records.sort(Comparator.comparingInt(r -> (Integer) r.getOrDefault("seq", 0)));

        List<Map<String, Object>> scoreProgression = records.stream()
                .filter(r -> r.containsKey("payload"))
                .map(r -> {
                    try {
                        Map<String, Object> payload = objectMapper.readValue(
                                (String) r.get("payload"), Map.class);
                        return Map.<String, Object>of(
                                "seq", r.get("seq"),
                                "score", payload.getOrDefault("riskScore", 0),
                                "timestamp", r.get("timestamp")
                        );
                    } catch (Exception e) {
                        return Map.<String, Object>of("seq", r.get("seq"), "score", 0);
                    }
                }).collect(Collectors.toList());

        return Map.of(
                "sessionId", sessionId,
                "totalRequests", records.size(),
                "events", records,
                "scoreProgression", scoreProgression
        );
    }

    public List<Map<String, Object>> getRecentSessions(int limit) {
        Set<ZSetOperations.TypedTuple<String>> sessions = redis.opsForZSet()
                .reverseRangeByScoreWithScores("replay:index", 0, Double.MAX_VALUE, 0, limit);
        if (sessions == null) return List.of();
        return sessions.stream().map(s -> Map.<String, Object>of(
                "sessionId", s.getValue(),
                "lastEvent", s.getScore() != null ? new Date(s.getScore().longValue()).toString() : ""
        )).collect(Collectors.toList());
    }
}
