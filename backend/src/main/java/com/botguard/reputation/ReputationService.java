package com.botguard.reputation;

import com.botguard.analytics.AnalyticsService;
import com.botguard.model.AnalyticsEvent;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class ReputationService {

    private static final Logger log = LoggerFactory.getLogger(ReputationService.class);

    private static final String IP_REP_PREFIX = "rep:ip:";
    private static final String SESSION_REP_PREFIX = "rep:session:";
    private static final String FP_REP_PREFIX = "rep:fp:";

    @Value("${botguard.reputation.decay-rate:0.95}")
    private double decayRate;

    @Value("${botguard.reputation.decay-interval-minutes:5}")
    private int decayIntervalMinutes;

    @Autowired
    private StringRedisTemplate redis;

    @Autowired
    private AnalyticsService analyticsService;

    @PostConstruct
    public void init() {
        log.info("ReputationService initialized: decayRate={}, decayInterval={}min",
                decayRate, decayIntervalMinutes);
    }

    public double getIpScore(String ip) {
        return getScore(IP_REP_PREFIX + ip);
    }

    public double getSessionScore(String sessionId) {
        return getScore(SESSION_REP_PREFIX + sessionId);
    }

    public double getFingerprintScore(String fingerprintHash) {
        return getScore(FP_REP_PREFIX + fingerprintHash);
    }

    public double getCombinedReputation(String ip, String sessionId, String fingerprintHash) {
        double ipScore = getIpScore(ip);
        double sessionScore = getSessionScore(sessionId);
        double fpScore = getFingerprintScore(fingerprintHash);

        return (ipScore * 0.4) + (sessionScore * 0.35) + (fpScore * 0.25);
    }

    public void updateScore(String ip, String sessionId, String fingerprintHash, int botScore) {
        double normalizedScore = 1.0 - (botScore / 100.0);

        updateSingleScore(IP_REP_PREFIX + ip, normalizedScore);
        updateSingleScore(SESSION_REP_PREFIX + sessionId, normalizedScore);
        if (fingerprintHash != null) {
            updateSingleScore(FP_REP_PREFIX + fingerprintHash, normalizedScore);
        }

        log.debug("Updated reputation scores: ip={}, session={}, fp={} | normalized={}",
                String.format("%.2f", getIpScore(ip)),
                String.format("%.2f", getSessionScore(sessionId)),
                fingerprintHash != null ? String.format("%.2f", getFingerprintScore(fingerprintHash)) : "N/A",
                String.format("%.2f", normalizedScore));

        analyticsService.publishEvent(new AnalyticsEvent(
                AnalyticsEvent.EventType.REPUTATION_CHANGE,
                sessionId, ip, botScore,
                Map.of("ipScore", getIpScore(ip), "sessionScore", getSessionScore(sessionId), "botScore", botScore)
        ));
    }

    @Scheduled(fixedDelayString = "${botguard.reputation.decay-interval-minutes:5}000")
    public void decayScores() {
        log.debug("Running reputation score decay (rate={})", decayRate);
        decayPrefix(IP_REP_PREFIX);
        decayPrefix(SESSION_REP_PREFIX);
        decayPrefix(FP_REP_PREFIX);
    }

    private double getScore(String key) {
        String val = redis.opsForValue().get(key);
        return val != null ? Double.parseDouble(val) : 1.0;
    }

    private void updateSingleScore(String key, double newScore) {
        double current = getScore(key);
        double blended = (current * 0.7) + (newScore * 0.3);
        redis.opsForValue().set(key, String.valueOf(blended), 24, TimeUnit.HOURS);
    }

    private void decayPrefix(String prefix) {
        var keys = redis.keys(prefix + "*");
        if (keys == null) return;
        for (String key : keys) {
            String val = redis.opsForValue().get(key);
            if (val != null) {
                double current = Double.parseDouble(val);
                double decayed = current * decayRate;
                redis.opsForValue().set(key, String.valueOf(Math.min(1.0, decayed)), 24, TimeUnit.HOURS);
            }
        }
    }

    public double getMultiplier(String sessionId, String ip, String fingerprintHash) {
        double rep = getCombinedReputation(ip, sessionId, fingerprintHash);
        if (rep < 0.3) return 1.5;
        if (rep < 0.5) return 1.2;
        if (rep < 0.7) return 1.0;
        return 0.8;
    }
}
