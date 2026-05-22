package com.botguard.honeypot;

import com.botguard.analytics.AnalyticsService;
import com.botguard.model.AnalyticsEvent;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class HoneypotService {

    private static final Logger log = LoggerFactory.getLogger(HoneypotService.class);
    private static final String HONEYPOT_HITS_KEY = "hp:%s";

    @Autowired
    private StringRedisTemplate redis;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private HoneypotConfig config;
    private final Set<String> allHoneypotPaths = ConcurrentHashMap.newKeySet();
    private final AtomicInteger dynamicCounter = new AtomicInteger(0);
    private final Random random = new Random();

    @PostConstruct
    public void init() {
        allHoneypotPaths.addAll(config.getAllStaticRoutes());
        generateDynamicRoutes();
        log.info("Initialized honeypot service with {} static and {} dynamic routes",
                config.getAllStaticRoutes().size(), config.getPoolSize());
    }

    public boolean isHoneypotPath(String path) {
        String normalized = path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
        boolean isTrap = allHoneypotPaths.contains(normalized);
        if (isTrap) {
            log.warn("Honeypot triggered: {}", path);
        }
        return isTrap;
    }

    public void recordHit(String sessionId) {
        String key = String.format(HONEYPOT_HITS_KEY, sessionId);
        String val = redis.opsForValue().get(key);
        int count = val != null ? Integer.parseInt(val) : 0;
        count++;
        redis.opsForValue().set(key, String.valueOf(count));
        redis.expire(key, java.time.Duration.ofHours(1));

        log.warn("Honeypot hit recorded for session {} (total: {})", sessionId, count);

        analyticsService.publishEvent(new AnalyticsEvent(
                AnalyticsEvent.EventType.HONEYPOT_HIT,
                sessionId, null, count,
                Map.of("hitCount", count, "path", "unknown")
        ));
    }

    public int getHoneypotHitCount(String sessionId) {
        String val = redis.opsForValue().get(String.format(HONEYPOT_HITS_KEY, sessionId));
        return val != null ? Integer.parseInt(val) : 0;
    }

    public void generateDynamicRoutes() {
        if (config == null || !config.isDynamicEnabled()) return;

        String[] prefixes = {"/api", "/admin", "/internal", "/debug", "/test", "/dev", "/staging", "/private"};
        String[] suffixes = {"/config", "/backup", "/dump", "/export", "/status", "/health", "/metrics",
                "/logs", "/secrets", "/tokens", "/credentials", "/users", "/auth", "/session",
                "/cache", "/queue", "/jobs", "/schedule", "/report", "/audit"};

        for (int i = 0; i < config.getPoolSize(); i++) {
            String route = prefixes[random.nextInt(prefixes.length)]
                    + "/" + generateRandomString(6)
                    + suffixes[random.nextInt(suffixes.length)];
            allHoneypotPaths.add(route);
        }
        log.debug("Generated {} dynamic honeypot routes", config.getPoolSize());
    }

    private String generateRandomString(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public Set<String> getAllHoneypotPaths() {
        return Collections.unmodifiableSet(allHoneypotPaths);
    }
}
