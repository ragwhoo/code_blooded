package com.botguard.analytics;

import com.botguard.model.EnvelopeEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.TimeUnit;

@Service
public class AnalyticsAggregatorService {
    private static final Logger log = LoggerFactory.getLogger(AnalyticsAggregatorService.class);

    private final StringRedisTemplate redis;

    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong humanRequests = new AtomicLong(0);
    private final AtomicLong botRequests = new AtomicLong(0);
    private final AtomicLong blockedRequests = new AtomicLong(0);
    private final AtomicLong mitigatedRequests = new AtomicLong(0);

    private final Map<String, AtomicLong> riskBuckets = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> mitigationBuckets = new ConcurrentHashMap<>();

    public AnalyticsAggregatorService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void record(EnvelopeEvent event) {
        totalRequests.incrementAndGet();

        Map<String, Object> payload = event.getPayload();
        if (payload == null) return;

        Number score = (Number) payload.get("riskScore");
        if (score != null) {
            if (score.doubleValue() >= 60) {
                botRequests.incrementAndGet();
            } else {
                humanRequests.incrementAndGet();
            }
            String bucket = getRiskBucket(score.doubleValue());
            riskBuckets.computeIfAbsent(bucket, k -> new AtomicLong(0)).incrementAndGet();
        }

        String action = (String) payload.get("mitigationAction");
        if (action != null && !"ALLOW".equals(action)) {
            mitigatedRequests.incrementAndGet();
            if ("TEMP_BLOCK".equals(action) || "RATE_LIMIT".equals(action)) {
                blockedRequests.incrementAndGet();
            }
            mitigationBuckets.computeIfAbsent(action, k -> new AtomicLong(0)).incrementAndGet();
        }
    }

    @Scheduled(fixedRate = 5000)
    public void flushToRedis() {
        long total = totalRequests.getAndSet(0);
        long human = humanRequests.getAndSet(0);
        long bot = botRequests.getAndSet(0);
        long blocked = blockedRequests.getAndSet(0);
        long mitigated = mitigatedRequests.getAndSet(0);

        if (total == 0 && mitigated == 0) return;

        redis.opsForHash().increment("analytics:rolling:1m", "total", total);
        redis.opsForHash().increment("analytics:rolling:1m", "human", human);
        redis.opsForHash().increment("analytics:rolling:1m", "bot", bot);
        redis.opsForHash().increment("analytics:rolling:1m", "blocked", blocked);
        redis.opsForHash().increment("analytics:rolling:1m", "mitigated", mitigated);
        redis.expire("analytics:rolling:1m", 120, TimeUnit.SECONDS);
    }

    @Scheduled(fixedRate = 60000)
    public void rollupMinute() {
        Map<Object, Object> counters = redis.opsForHash().entries("analytics:rolling:1m");
        if (counters == null || counters.isEmpty()) return;

        long epochMinute = Instant.now().getEpochSecond() / 60;
        long total = getLong(counters.get("total"));
        long human = getLong(counters.get("human"));
        long bot = getLong(counters.get("bot"));
        long blocked = getLong(counters.get("blocked"));
        long mitigated = getLong(counters.get("mitigated"));

        String value = String.format("{\"total\":%d,\"human\":%d,\"bot\":%d,\"blocked\":%d,\"mitigated\":%d}",
                total, human, bot, blocked, mitigated);

        redis.opsForZSet().add("analytics:timeseries:total", value, epochMinute);
        redis.expire("analytics:timeseries:total", 86400, TimeUnit.SECONDS);

        riskBuckets.forEach((bucket, count) -> {
            long c = count.getAndSet(0);
            if (c > 0) {
                String riskKey = "analytics:risk:" + bucket;
                redis.opsForZSet().incrementScore(riskKey, String.valueOf(epochMinute), c);
                redis.expire(riskKey, 86400, TimeUnit.SECONDS);
            }
        });

        mitigationBuckets.forEach((action, count) -> {
            long c = count.getAndSet(0);
            if (c > 0) {
                String mitKey = "analytics:mitigation:" + action;
                redis.opsForZSet().incrementScore(mitKey, String.valueOf(epochMinute), c);
                redis.expire(mitKey, 86400, TimeUnit.SECONDS);
            }
        });

        redis.delete("analytics:rolling:1m");
    }

    private String getRiskBucket(double score) {
        if (score >= 80) return "81-100";
        if (score >= 60) return "61-80";
        if (score >= 40) return "41-60";
        if (score >= 20) return "21-40";
        return "0-20";
    }

    private long getLong(Object val) {
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).longValue();
        if (val instanceof String) return Long.parseLong((String) val);
        return 0;
    }
}
