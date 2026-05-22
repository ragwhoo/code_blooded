package com.botguard.honeypot;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class HoneypotAnalyticsService {
    private final StringRedisTemplate redis;
    private final HoneypotConfig honeypotConfig;

    private static final String OFFENDERS_KEY = "honeypot:offenders";

    public HoneypotAnalyticsService(StringRedisTemplate redis, HoneypotConfig honeypotConfig) {
        this.redis = redis;
        this.honeypotConfig = honeypotConfig;
    }

    public Map<String, Object> getStats() {
        List<String> trapNames = honeypotConfig.getAllStaticRoutes();
        List<Map<String, Object>> traps = new ArrayList<>();
        long totalHits = 0;

        for (String name : trapNames) {
            String key = "honeypot:stats:" + name;
            Map<Object, Object> data = redis.opsForHash().entries(key);
            if (data == null || data.isEmpty()) {
                traps.add(Map.of(
                        "name", name, "type", "static",
                        "hits", 0, "uniqueSessions", 0,
                        "blocked", 0, "challenged", 0, "status", "active"
                ));
                continue;
            }
            long hits = getLong(data.get("hits"));
            long uniqueSessions = getLong(data.get("uniqueSessions"));
            long blocked = getLong(data.get("blocked"));
            long challenged = getLong(data.get("challenged"));
            totalHits += hits;
            traps.add(Map.of(
                    "name", name,
                    "type", data.getOrDefault("type", "static"),
                    "hits", hits,
                    "uniqueSessions", uniqueSessions,
                    "blocked", blocked,
                    "challenged", challenged,
                    "status", "active"
            ));
        }

        Set<ZSetOperations.TypedTuple<String>> offenders = redis.opsForZSet()
                .reverseRangeByScoreWithScores(OFFENDERS_KEY, 0, Double.MAX_VALUE, 0, 10);
        List<Map<String, Object>> topOffenders = new ArrayList<>();
        if (offenders != null) {
            for (ZSetOperations.TypedTuple<String> t : offenders) {
                topOffenders.add(Map.of(
                        "sessionId", t.getValue(),
                        "hitCount", t.getScore() != null ? t.getScore().longValue() : 0
                ));
            }
        }

        double conversionRate = totalHits > 0
                ? (double) traps.stream().mapToLong(t -> (Integer) t.get("blocked")).sum() / totalHits
                : 0;

        return Map.of(
                "traps", traps,
                "topOffenders", topOffenders,
                "totalHits", totalHits,
                "conversionRate", Math.round(conversionRate * 100.0) / 100.0
        );
    }

    private long getLong(Object val) {
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).longValue();
        if (val instanceof String) return Long.parseLong((String) val);
        return 0;
    }
}
