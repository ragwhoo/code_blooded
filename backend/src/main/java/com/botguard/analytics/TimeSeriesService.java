package com.botguard.analytics;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TimeSeriesService {
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public TimeSeriesService(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> getTimeSeries(int minutes) {
        long minEpoch = (Instant.now().getEpochSecond() / 60) - minutes;
        long maxEpoch = Instant.now().getEpochSecond() / 60;
        Set<ZSetOperations.TypedTuple<String>> results = redis.opsForZSet()
                .rangeByScoreWithScores("analytics:timeseries:total", minEpoch, maxEpoch);
        if (results == null) return List.of();
        return results.stream().map(t -> {
            try {
                Map<String, Object> point = objectMapper.readValue(t.getValue(), new TypeReference<>() {});
                long epochMin = t.getScore().longValue();
                point.put("time", epochMin * 60 * 1000);
                return point;
            } catch (Exception e) {
                return Map.<String, Object>of();
            }
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getBotVsHuman(int minutes) {
        List<Map<String, Object>> series = getTimeSeries(minutes);
        long totalHuman = 0, totalBot = 0;
        for (Map<String, Object> point : series) {
            totalHuman += ((Number) point.getOrDefault("human", 0)).longValue();
            totalBot += ((Number) point.getOrDefault("bot", 0)).longValue();
        }
        return Map.of("human", totalHuman, "bot", totalBot, "period", "last_" + minutes + "_minutes");
    }

    public List<Map<String, Object>> getRiskDistribution() {
        String[] ranges = {"0-20", "21-40", "41-60", "61-80", "81-100"};
        List<Map<String, Object>> result = new ArrayList<>();
        for (String range : ranges) {
            String key = "analytics:risk:" + range;
            Long count = redis.opsForZSet().zCard(key);
            result.add(Map.of("range", range, "count", count != null ? count : 0L));
        }
        return result;
    }

    public List<Map<String, Object>> getMitigationDistribution() {
        String[] actions = {"ALLOW", "SOFT_THROTTLE", "ARTIFICIAL_DELAY", "RATE_LIMIT", "CAPTCHA_SIM", "TEMP_BLOCK"};
        List<Map<String, Object>> result = new ArrayList<>();
        for (String action : actions) {
            String key = "analytics:mitigation:" + action;
            Long count = redis.opsForZSet().zCard(key);
            if (count != null && count > 0) {
                result.add(Map.of("name", action, "value", count));
            }
        }
        return result;
    }
}
