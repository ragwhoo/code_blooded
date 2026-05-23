package com.botguard.mitigation;

import com.botguard.model.MitigationAction;
import com.botguard.model.RiskLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class MitigationEngine {
    private static final Logger log = LoggerFactory.getLogger(MitigationEngine.class);

    private final StringRedisTemplate redis;

    private static final double THROTTLE_THRESHOLD = 70;
    private static final double CHALLENGE_THRESHOLD = 80;
    private static final double BLOCK_THRESHOLD = 90;
    private static final double BAN_THRESHOLD = 99;

    private static final long IP_BAN_TTL_SECONDS = 86400;
    private static final long SESSION_TTL_SECONDS = 3600;
    private static final long FINGERPRINT_TTL_SECONDS = 259200;

    private static final String KEY_IP = "mitigation:ip:";
    private static final String KEY_SESSION = "mitigation:session:";
    private static final String KEY_FINGERPRINT = "mitigation:fingerprint:";
    private static final String KEY_ESCALATIONS = "mitigation:escalations:";
    private static final String INDEX_BLOCKED_IPS = "mitigation:index:blockedIps";
    private static final String INDEX_HIGH_RISK = "mitigation:index:highRiskSessions";

    // Only acceptable in-memory state: ephemeral per-request counter
    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();

    public MitigationEngine(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public MitigationAction evaluate(double score, String sessionId, String ipAddress, String fingerprint) {
        RiskLevel level = RiskLevel.fromScore((int) score);

        if (isBlocked(ipAddress, sessionId, fingerprint)) {
            return MitigationAction.TEMP_BLOCK;
        }

        MitigationAction action;
        if (score >= BAN_THRESHOLD) {
            action = MitigationAction.TEMP_BLOCK;
            persistMitigation(ipAddress, sessionId, fingerprint, action, score);
        } else if (score >= BLOCK_THRESHOLD) {
            action = MitigationAction.TEMP_BLOCK;
            persistMitigation(ipAddress, sessionId, fingerprint, action, score);
        } else if (score >= CHALLENGE_THRESHOLD) {
            action = MitigationAction.CAPTCHA_SIM;
            persistMitigation(ipAddress, sessionId, fingerprint, action, score);
        } else if (score >= THROTTLE_THRESHOLD) {
            action = MitigationAction.RATE_LIMIT;
            persistMitigation(ipAddress, sessionId, fingerprint, action, score);
        } else {
            action = MitigationAction.ALLOW;
        }

        return action;
    }

    public boolean isBlocked(String ipAddress, String sessionId, String fingerprint) {
        if (Boolean.TRUE.equals(redis.opsForSet().isMember(INDEX_BLOCKED_IPS, ipAddress))) {
            String storedAction = (String) redis.opsForHash().get(KEY_IP + ipAddress, "action");
            if (MitigationAction.TEMP_BLOCK.name().equals(storedAction)) return true;
        }
        String sessionAction = (String) redis.opsForHash().get(KEY_SESSION + sessionId, "action");
        if (MitigationAction.TEMP_BLOCK.name().equals(sessionAction)) return true;
        if (fingerprint != null && !fingerprint.isBlank()) {
            String fpAction = (String) redis.opsForHash().get(KEY_FINGERPRINT + fingerprint, "action");
            if (MitigationAction.TEMP_BLOCK.name().equals(fpAction)) return true;
        }
        return false;
    }

    public boolean isSessionBlocked(String sessionId) {
        return isBlocked(null, sessionId, null);
    }

    private void persistMitigation(String ip, String sessionId, String fingerprint, MitigationAction action, double score) {
        Instant now = Instant.now();

        redis.opsForHash().putAll(KEY_SESSION + sessionId, Map.of(
                "action", action.name(),
                "score", String.valueOf(score),
                "escalated", "false",
                "timestamp", now.toString()
        ));
        redis.expire(KEY_SESSION + sessionId, SESSION_TTL_SECONDS, TimeUnit.SECONDS);

        if (action == MitigationAction.TEMP_BLOCK) {
            redis.opsForHash().putAll(KEY_IP + ip, Map.of(
                    "action", action.name(),
                    "score", String.valueOf(score),
                    "escalated", "true",
                    "blockedAt", now.toString(),
                    "expiresAt", now.plusSeconds(IP_BAN_TTL_SECONDS).toString()
            ));
            redis.expire(KEY_IP + ip, IP_BAN_TTL_SECONDS, TimeUnit.SECONDS);
            redis.opsForSet().add(INDEX_BLOCKED_IPS, ip);
            redis.opsForSet().add(INDEX_HIGH_RISK, sessionId);
        }

        if (fingerprint != null && !fingerprint.isBlank()) {
            redis.opsForHash().increment(KEY_FINGERPRINT + fingerprint, "hitCount", 1);
            redis.opsForHash().put(KEY_FINGERPRINT + fingerprint, "action", action.name());
            redis.opsForHash().put(KEY_FINGERPRINT + fingerprint, "score", String.valueOf(score));
            redis.expire(KEY_FINGERPRINT + fingerprint, FINGERPRINT_TTL_SECONDS, TimeUnit.SECONDS);
        }

        redis.opsForZSet().add(KEY_ESCALATIONS + sessionId, action.name() + ":" + now, now.toEpochMilli());
        redis.expire(KEY_ESCALATIONS + sessionId, SESSION_TTL_SECONDS, TimeUnit.SECONDS);
    }

    public void clearExpiredBans() {
        Set<String> blockedIps = redis.opsForSet().members(INDEX_BLOCKED_IPS);
        if (blockedIps == null) return;
        for (String ip : blockedIps) {
            Boolean exists = redis.hasKey(KEY_IP + ip);
            if (Boolean.FALSE.equals(exists)) {
                redis.opsForSet().remove(INDEX_BLOCKED_IPS, ip);
            }
        }
    }

    @Scheduled(fixedRate = 300000)
    public void scheduledCleanup() {
        clearExpiredBans();
    }

    public void incrementRequestCount(String sessionId) {
        requestCounts.merge(sessionId, 1, Integer::sum);
    }

    public int getRequestCount(String sessionId) {
        return requestCounts.getOrDefault(sessionId, 0);
    }

    public long getBlockedCount() {
        Set<String> blockedIps = redis.opsForSet().members(INDEX_BLOCKED_IPS);
        return blockedIps == null ? 0 : blockedIps.size();
    }

    public void clearBlock(String ip) {
        redis.opsForSet().remove(INDEX_BLOCKED_IPS, ip);
        redis.delete(KEY_IP + ip);
    }
}
