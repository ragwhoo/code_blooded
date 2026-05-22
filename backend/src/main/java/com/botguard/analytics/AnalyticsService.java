package com.botguard.analytics;

import com.botguard.model.AnalyticsEvent;
import com.botguard.model.EnvelopeEvent;
import com.botguard.model.EventType;
import com.botguard.websocket.SimpleWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Autowired(required = false)
    private SimpleWebSocketHandler webSocketHandler;

    private final ConcurrentLinkedDeque<AnalyticsEvent> eventBuffer = new ConcurrentLinkedDeque<>();
    private final AtomicInteger totalRequests = new AtomicInteger(0);
    private final AtomicInteger blockedRequests = new AtomicInteger(0);
    private final AtomicInteger activeSessions = new AtomicInteger(0);
    private final AtomicInteger botDetections = new AtomicInteger(0);
    private final Map<String, Long> requestTimestamps = new ConcurrentHashMap<>();
    private final AtomicLong lastRequestTime = new AtomicLong(System.currentTimeMillis());

    public void incrementRequestCount() {
        totalRequests.incrementAndGet();
        lastRequestTime.set(System.currentTimeMillis());
    }

    public void incrementBlockedCount() {
        blockedRequests.incrementAndGet();
    }

    public void setActiveSessions(int count) {
        activeSessions.set(count);
    }

    public void incrementBotDetections() {
        botDetections.incrementAndGet();
    }

    @Async("asyncExecutor")
    public void publishEvent(AnalyticsEvent event) {
        eventBuffer.add(event);
        if (eventBuffer.size() > 1000) {
            eventBuffer.poll();
        }

        if (messagingTemplate != null) {
            try {
                String topic = switch (event.getType()) {
                    case DETECTION -> "/topic/threats";
                    case MITIGATION, BLOCK -> "/topic/analytics";
                    case HONEYPOT_HIT -> "/topic/analytics";
                    case REPUTATION_CHANGE -> "/topic/analytics";
                };
                messagingTemplate.convertAndSend(topic, event);

                if (event.getSessionId() != null) {
                    messagingTemplate.convertAndSend(
                            "/topic/sessions/" + event.getSessionId(), event);
                }
            } catch (Exception e) {
                log.warn("Failed to send WebSocket event: {}", e.getMessage());
            }
        }

        if (webSocketHandler != null) {
            webSocketHandler.broadcast(event);
        }

        log.debug("Analytics event: type={}, session={}, score={}",
                event.getType(), event.getSessionId(), event.getScore());
    }

    public void recordEvent(EnvelopeEvent event) {
        totalRequests.incrementAndGet();

        Map<String, Object> payload = event.getPayload();
        if (payload == null) return;

        String action = (String) payload.get("mitigationAction");
        if ("TEMP_BLOCK".equals(action) || "RATE_LIMIT".equals(action)) {
            blockedRequests.incrementAndGet();
        }

        Number score = (Number) payload.get("riskScore");
        if (score != null && score.doubleValue() >= 60) {
            botDetections.incrementAndGet();
        }

        AnalyticsEvent legacyEvent = new AnalyticsEvent(
                AnalyticsEvent.EventType.DETECTION,
                event.getSessionId(),
                (String) payload.get("ipAddress"),
                score != null ? score.intValue() : 0,
                payload
        );
        publishEvent(legacyEvent);
    }

    public double getRequestsPerSecond() {
        long now = System.currentTimeMillis();
        long cutoff = now - 5000;
        long count = requestTimestamps.values().stream()
                .filter(t -> t > cutoff)
                .count();
        return count / 5.0;
    }

    public int getActiveSessions() {
        return activeSessions.get();
    }

    public int getTotalRequests() {
        return totalRequests.get();
    }

    public int getBlockedRequests() {
        return blockedRequests.get();
    }

    public int getBotDetections() {
        return botDetections.get();
    }

    public List<AnalyticsEvent> getRecentEvents(int limit) {
        return eventBuffer.stream()
                .sorted(Comparator.comparing(AnalyticsEvent::getTimestamp).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("requestsPerSecond", String.format("%.1f", getRequestsPerSecond()));
        stats.put("totalRequests", totalRequests.get());
        stats.put("activeSessions", activeSessions.get());
        stats.put("blockedRequests", blockedRequests.get());
        stats.put("botDetections", botDetections.get());
        stats.put("timestamp", Instant.now().toString());
        return stats;
    }

    public void recordRequestTimestamp(String sessionId) {
        requestTimestamps.put(sessionId, System.currentTimeMillis());
    }
}
