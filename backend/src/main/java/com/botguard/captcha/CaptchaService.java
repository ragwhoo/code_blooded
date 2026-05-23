package com.botguard.captcha;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class CaptchaService {
    private static final String KEY_PREFIX = "captcha:";
    private static final long TTL_SECONDS = 60;
    private final SecureRandom random = new SecureRandom();
    private final StringRedisTemplate redis;

    public CaptchaService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public CaptchaChallenge generateChallenge(String sessionId) {
        int a = random.nextInt(99) + 1;
        int b = random.nextInt(99) + 1;
        int answer = a + b;
        String id = UUID.randomUUID().toString();
        redis.opsForValue().set(KEY_PREFIX + id, String.valueOf(answer), TTL_SECONDS, TimeUnit.SECONDS);
        redis.opsForValue().set(KEY_PREFIX + "session:" + sessionId, id, TTL_SECONDS, TimeUnit.SECONDS);
        return new CaptchaChallenge(id, a + " + " + b + " = ?", answer);
    }

    public boolean verify(String challengeId, int answer) {
        String stored = redis.opsForValue().getAndDelete(KEY_PREFIX + challengeId);
        if (stored == null) return false;
        return Integer.parseInt(stored) == answer;
    }

    public String getActiveChallengeId(String sessionId) {
        return redis.opsForValue().get(KEY_PREFIX + "session:" + sessionId);
    }

    public void clearSession(String sessionId) {
        String id = redis.opsForValue().getAndDelete(KEY_PREFIX + "session:" + sessionId);
        if (id != null) redis.delete(KEY_PREFIX + id);
    }
}
