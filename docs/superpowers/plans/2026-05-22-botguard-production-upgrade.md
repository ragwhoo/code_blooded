# BotGuard Production-Grade Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing anti-bot detection platform into a production-grade cybersecurity analytics platform with distributed Redis state, real-time WebSocket streaming, adaptive risk scoring, geo-intelligence, replay forensics, and SOC-style dashboard.

**Architecture:** Event-driven architecture using Spring `ApplicationEventPublisher` as the central Event Bus. All subsystems (mitigation, analytics, replay, WebSocket) subscribe to events through listeners. All persistent state moves to Redis with TTL — zero in-memory caches. Frontend uses STOMP + SockJS for real-time streaming with proper topic segmentation and auto-reconnect.

**Tech Stack:** Java 17, Spring Boot 3.2.5, Redis (ZSETs, Streams, Hashes, Sets), STOMP + SockJS, React 18, Tailwind CSS 4, Recharts, Framer Motion, Lucide React, MaxMind GeoLite2

**Build Order (sequential):**
- Phase 1: Redis Persistent Mitigation + Event Bus Architecture
- Phase 2: Real WebSocket Streaming (STOMP + SockJS)
- Phase 3: Real Time-Series Analytics
- Phase 4: Honeypot Analytics
- Phase 5: Geo-IP Enrichment
- Phase 6: Adaptive Risk Scoring Engine
- Phase 7: Attack Replay System
- Phase 8: Frontend SOC Dashboard Polish

---

## Phase 1: Redis Persistent Mitigation + Event Bus Architecture

### Task 1.1: Create Event Envelope Models

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\model\EventType.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\model\SeverityLevel.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\model\EnvelopeEvent.java`

- [ ] **Step 1: Create EventType enum**

```java
package com.botguard.model;

public enum EventType {
    DETECTION,
    MITIGATION,
    HONEYPOT,
    REPUTATION,
    SESSION,
    ANALYTICS
}
```

- [ ] **Step 2: Create SeverityLevel enum**

```java
package com.botguard.model;

public enum SeverityLevel {
    LOW(0),
    MEDIUM(1),
    HIGH(2),
    CRITICAL(3);

    private final int priority;
    SeverityLevel(int priority) { this.priority = priority; }
    public int getPriority() { return priority; }

    public static SeverityLevel fromScore(double score) {
        if (score >= 80) return CRITICAL;
        if (score >= 60) return HIGH;
        if (score >= 30) return MEDIUM;
        return LOW;
    }
}
```

- [ ] **Step 3: Create EnvelopeEvent model**

```java
package com.botguard.model;

import java.time.Instant;
import java.util.Map;

public class EnvelopeEvent {
    private EventType type;
    private String version = "1.0";
    private Instant timestamp;
    private String sessionId;
    private String tenantId = "default";
    private SeverityLevel severity;
    private Map<String, Object> payload;
    private Map<String, Object> metadata;

    public EnvelopeEvent() {}

    public EnvelopeEvent(EventType type, String sessionId, SeverityLevel severity, Map<String, Object> payload) {
        this.type = type;
        this.timestamp = Instant.now();
        this.sessionId = sessionId;
        this.severity = severity;
        this.payload = payload;
    }

    public EventType getType() { return type; }
    public void setType(EventType type) { this.type = type; }
    public String getVersion() { return version; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getTenantId() { return tenantId; }
    public SeverityLevel getSeverity() { return severity; }
    public void setSeverity(SeverityLevel severity) { this.severity = severity; }
    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
```

### Task 1.2: Create Event Bus Service + DetectionEvent

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\event\DetectionEvent.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\event\EventBusService.java`

- [ ] **Step 1: Create DetectionEvent (Spring ApplicationEvent)**

```java
package com.botguard.event;

import com.botguard.model.EnvelopeEvent;
import org.springframework.context.ApplicationEvent;

public class DetectionEvent extends ApplicationEvent {
    private final EnvelopeEvent envelope;

    public DetectionEvent(Object source, EnvelopeEvent envelope) {
        super(source);
        this.envelope = envelope;
    }

    public EnvelopeEvent getEnvelope() { return envelope; }
}
```

- [ ] **Step 2: Create EventBusService**

```java
package com.botguard.event;

import com.botguard.model.EnvelopeEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class EventBusService {
    private static final Logger log = LoggerFactory.getLogger(EventBusService.class);
    private final ApplicationEventPublisher publisher;

    public EventBusService(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void publish(EnvelopeEvent event) {
        log.debug("Publishing event: type={}, sessionId={}, severity={}",
                event.getType(), event.getSessionId(), event.getSeverity());
        publisher.publishEvent(new DetectionEvent(this, event));
    }
}
```

### Task 1.3: Create All Event Listeners

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\listener\MitigationEventListener.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\listener\AnalyticsEventListener.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\listener\ReplayEventListener.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\listener\WebSocketEventListener.java`

- [ ] **Step 1: Create MitigationEventListener**

```java
package com.botguard.listener;

import com.botguard.event.DetectionEvent;
import com.botguard.event.EventBusService;
import com.botguard.mitigation.MitigationEngine;
import com.botguard.model.EnvelopeEvent;
import com.botguard.model.EventType;
import com.botguard.model.MitigationAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class MitigationEventListener {
    private static final Logger log = LoggerFactory.getLogger(MitigationEventListener.class);
    private final MitigationEngine mitigationEngine;
    private final EventBusService eventBus;

    public MitigationEventListener(MitigationEngine mitigationEngine, EventBusService eventBus) {
        this.mitigationEngine = mitigationEngine;
        this.eventBus = eventBus;
    }

    @EventListener
    public void onDetection(DetectionEvent event) {
        EnvelopeEvent envelope = event.getEnvelope();
        if (envelope.getType() != EventType.DETECTION) return;

        Map<String, Object> payload = envelope.getPayload();
        if (payload == null) return;

        Number scoreNum = (Number) payload.get("riskScore");
        if (scoreNum == null) return;

        double score = scoreNum.doubleValue();
        String sessionId = envelope.getSessionId();
        String ipAddress = (String) payload.get("ipAddress");
        String fingerprint = (String) payload.get("fingerprint");

        MitigationAction action = mitigationEngine.evaluate(score, sessionId, ipAddress, fingerprint);

        if (action != MitigationAction.ALLOW) {
            log.info("Mitigation applied: session={}, score={}, action={}", sessionId, score, action);

            EnvelopeEvent mitigationEvent = new EnvelopeEvent(
                    EventType.MITIGATION, sessionId, envelope.getSeverity(),
                    Map.of("riskScore", score, "action", action.name(), "ipAddress", ipAddress));
            eventBus.publish(mitigationEvent);
        }
    }
}
```

- [ ] **Step 2: Create AnalyticsEventListener**

```java
package com.botguard.listener;

import com.botguard.event.DetectionEvent;
import com.botguard.analytics.AnalyticsService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsEventListener {
    private final AnalyticsService analyticsService;

    public AnalyticsEventListener(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @EventListener
    public void onEvent(DetectionEvent event) {
        analyticsService.recordEvent(event.getEnvelope());
    }
}
```

- [ ] **Step 3: Create ReplayEventListener**

```java
package com.botguard.listener;

import com.botguard.event.DetectionEvent;
import com.botguard.replay.ReplayRecorder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ReplayEventListener {
    private static final Logger log = LoggerFactory.getLogger(ReplayEventListener.class);
    private final ReplayRecorder replayRecorder;

    public ReplayEventListener(ReplayRecorder replayRecorder) {
        this.replayRecorder = replayRecorder;
    }

    @EventListener
    public void onEvent(DetectionEvent event) {
        replayRecorder.record(event.getEnvelope());
    }
}
```

- [ ] **Step 4: Create WebSocketEventListener**

```java
package com.botguard.listener;

import com.botguard.event.DetectionEvent;
import com.botguard.model.EnvelopeEvent;
import com.botguard.model.SeverityLevel;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketEventListener {
    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @EventListener
    public void onEvent(DetectionEvent event) {
        EnvelopeEvent envelope = event.getEnvelope();

        try {
            String json = objectMapper.writeValueAsString(envelope);

            // All events to /topic/events
            messagingTemplate.convertAndSend("/topic/events", envelope);

            // HIGH/CRITICAL to /topic/threats
            if (envelope.getSeverity() == SeverityLevel.HIGH || envelope.getSeverity() == SeverityLevel.CRITICAL) {
                messagingTemplate.convertAndSend("/topic/threats", envelope);
            }

            // Mitigation events to /topic/mitigations
            if (envelope.getType() == com.botguard.model.EventType.MITIGATION) {
                messagingTemplate.convertAndSend("/topic/mitigations", envelope);
            }

        } catch (Exception e) {
            log.error("Failed to publish event to WebSocket: {}", e.getMessage());
        }
    }
}
```

### Task 1.4: Rewrite MitigationEngine with Redis Backing

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\mitigation\MitigationEngine.java` (rewrite)

- [ ] **Step 1: Write Redis-backed MitigationEngine**

```java
package com.botguard.mitigation;

import com.botguard.model.MitigationAction;
import com.botguard.model.RiskLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class MitigationEngine {
    private static final Logger log = LoggerFactory.getLogger(MitigationEngine.class);

    private final StringRedisTemplate redis;

    // Escalation thresholds
    private static final double THROTTLE_THRESHOLD = 30;
    private static final double CHALLENGE_THRESHOLD = 60;
    private static final double BLOCK_THRESHOLD = 80;
    private static final double BAN_THRESHOLD = 90;

    // TTLs
    private static final long IP_BAN_TTL_SECONDS = 86400;    // 24h
    private static final long SESSION_TTL_SECONDS = 3600;     // 1h
    private static final long FINGERPRINT_TTL_SECONDS = 259200; // 72h

    // Redis key prefixes
    private static final String KEY_IP = "mitigation:ip:";
    private static final String KEY_SESSION = "mitigation:session:";
    private static final String KEY_FINGERPRINT = "mitigation:fingerprint:";
    private static final String KEY_ESCALATIONS = "mitigation:escalations:";
    private static final String INDEX_BLOCKED_IPS = "mitigation:index:blockedIps";
    private static final String INDEX_HIGH_RISK = "mitigation:index:highRiskSessions";

    // In-memory request count cache (per-request counter, NOT state)
    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();

    public MitigationEngine(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public MitigationAction evaluate(double score, String sessionId, String ipAddress, String fingerprint) {
        RiskLevel level = RiskLevel.fromScore(score);

        // Check existing mitigations in Redis
        if (isBlocked(ipAddress, sessionId, fingerprint)) {
            return MitigationAction.TEMP_BLOCK;
        }

        // Apply mitigation based on score
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

        // Track escalation: if session already has a mitigation, escalate
        String escalationKey = KEY_ESCALATIONS + sessionId;
        String existingAction = (String) redis.opsForHash().get(escalationKey, "action");
        if (existingAction != null && !existingAction.equals(action.name())) {
            log.info("Escalation for session {}: {} -> {}", sessionId, existingAction, action);
        }

        return action;
    }

    public boolean isBlocked(String ipAddress, String sessionId, String fingerprint) {
        if (redis.opsForSet().isMember(INDEX_BLOCKED_IPS, ipAddress)) {
            String ttl = (String) redis.opsForHash().get(KEY_IP + ipAddress, "action");
            return MitigationAction.TEMP_BLOCK.name().equals(ttl);
        }
        String sessionAction = (String) redis.opsForHash().get(KEY_SESSION + sessionId, "action");
        if (MitigationAction.TEMP_BLOCK.name().equals(sessionAction)) return true;
        String fpAction = (String) redis.opsForHash().get(KEY_FINGERPRINT + fingerprint, "action");
        return MitigationAction.TEMP_BLOCK.name().equals(fpAction);
    }

    private void persistMitigation(String ip, String sessionId, String fingerprint, MitigationAction action, double score) {
        Instant now = Instant.now();

        // Session-level mitigation
        redis.opsForHash().putAll(KEY_SESSION + sessionId, Map.of(
                "action", action.name(),
                "score", String.valueOf(score),
                "escalated", "false",
                "timestamp", now.toString()
        ));
        redis.expire(KEY_SESSION + sessionId, SESSION_TTL_SECONDS, TimeUnit.SECONDS);

        // IP-level mitigation (for blocks)
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

        // Fingerprint-level mitigation (for repeated offenders)
        if (fingerprint != null && !fingerprint.isBlank()) {
            redis.opsForHash().increment(KEY_FINGERPRINT + fingerprint, "hitCount", 1);
            redis.opsForHash().put(KEY_FINGERPRINT + fingerprint, "action", action.name());
            redis.opsForHash().put(KEY_FINGERPRINT + fingerprint, "score", String.valueOf(score));
            redis.expire(KEY_FINGERPRINT + fingerprint, FINGERPRINT_TTL_SECONDS, TimeUnit.SECONDS);
        }

        // Escalation history
        redis.opsForZSet().add(KEY_ESCALATIONS + sessionId, action.name() + ":" + now, now.toEpochMilli());
        redis.expire(KEY_ESCALATIONS + sessionId, SESSION_TTL_SECONDS, TimeUnit.SECONDS);
    }

    public void clearExpiredBans() {
        // Cleanup is handled by Redis TTL automatically.
        // This method exists for proactive cleanup of index sets.
        Set<String> blockedIps = redis.opsForSet().members(INDEX_BLOCKED_IPS);
        if (blockedIps == null) return;
        for (String ip : blockedIps) {
            Boolean exists = redis.hasKey(KEY_IP + ip);
            if (Boolean.FALSE.equals(exists)) {
                redis.opsForSet().remove(INDEX_BLOCKED_IPS, ip);
            }
        }
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
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
}
```

- [ ] **Step 2: Remove old in-memory blockedSessions map**

Verify that `MitigationEngine` no longer has any `ConcurrentHashMap` for blocked sessions. Only the `requestCounts` counter map remains (per-request ephemeral data, acceptable).

### Task 1.5: Configure STOMP WebSocket + Update Redis Config

**Files:**
- Rewrite: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\websocket\WebSocketConfig.java`
- Modify: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\config\RedisConfig.java`

- [ ] **Step 1: Rewrite WebSocketConfig for STOMP**

```java
package com.botguard.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setHeartbeatReceived(10000);
        config.setHeartbeatSent(10000);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-stomp")
                .setAllowedOriginPatterns("*")
                .withSockJS()
                .setDisconnectDelay(30000)
                .setHeartbeatTime(10000);
    }
}
```

- [ ] **Step 2: Update RedisConfig to add stream support**

```java
package com.botguard.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory, ObjectMapper objectMapper) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer(objectMapper));
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer(objectMapper));
        template.afterPropertiesSet();
        return template;
    }
}
```

### Task 1.6: Modify RequestInterceptor to Use Event Bus

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\interceptor\RequestInterceptor.java`

- [ ] **Step 1: Read existing RequestInterceptor**

Read the file to understand current implementation before modifying.

- [ ] **Step 2: Modify RequestInterceptor to publish events via EventBusService**

Edit the interceptor to inject `EventBusService` and publish `EnvelopeEvent` after computing the bot score:

Find where `BotScore` is computed and mitigation action is determined. After mitigation is applied, publish an event:

```java
// After mitigation action is applied, publish detection event
Map<String, Object> payload = new HashMap<>();
payload.put("riskScore", botScore.score());
payload.put("level", botScore.riskLevel().name());
payload.put("mitigationAction", action.name());
payload.put("ipAddress", ipAddress);
payload.put("fingerprint", fingerprint);
payload.put("userAgent", request.getHeader("User-Agent"));
payload.put("path", request.getRequestURI());
payload.put("method", request.getMethod());
if (botScore.breakdown() != null) {
    payload.put("signals", botScore.breakdown());
}

SeverityLevel severity = SeverityLevel.fromScore(botScore.score());
EnvelopeEvent envelopeEvent = new EnvelopeEvent(
        EventType.DETECTION, sessionId, severity, payload
);
eventBus.publish(envelopeEvent);
```

### Task 1.7: Create ReplayRecorder (stub for Phase 7)

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\replay\ReplayRecorder.java`

- [ ] **Step 1: Create ReplayRecorder stub using Redis Streams**

```java
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

            String streamKey = "replay:stream:" + sessionId;

            // Add to replay stream
            Map<String, String> fields = Map.of(
                    "type", event.getType().name(),
                    "timestamp", event.getTimestamp().toString(),
                    "severity", event.getSeverity().name(),
                    "payload", objectMapper.writeValueAsString(event.getPayload()),
                    "metadata", event.getMetadata() != null ? objectMapper.writeValueAsString(event.getMetadata()) : "{}"
            );

            redis.opsForStream().add(streamKey, fields);
            redis.expire(streamKey, REPLAY_TTL_SECONDS, TimeUnit.SECONDS);

            // Add to replay index
            redis.opsForZSet().add("replay:index", sessionId, System.currentTimeMillis());
            redis.expire("replay:index", REPLAY_TTL_SECONDS, TimeUnit.SECONDS);

        } catch (Exception e) {
            log.error("Failed to record replay event: {}", e.getMessage());
        }
    }
}
```

### Task 1.8: Update Existing AnalyticsService for Event Bus Integration

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\analytics\AnalyticsService.java`

- [ ] **Step 1: Add recordEvent(EnvelopeEvent) method to AnalyticsService**

Read existing `AnalyticsService.java`, then add:

```java
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

    // Record event in local buffer
    recordLocalEvent(event);
}
```

---

## Phase 2: Real WebSocket Streaming (Frontend)

### Task 2.1: Install Frontend Dependencies

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\package.json`

- [ ] **Step 1: Install STOMP + SockJS packages**

```bash
cd C:\Users\raghu\Desktop\botguard\frontend
npm install @stomp/stompjs sockjs-client
```

### Task 2.2: Create useStomp Hook

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\frontend\src\hooks\useStomp.js`
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\src\hooks\useWebSocket.js`

- [ ] **Step 1: Create useStomp.js**

```javascript
import { useState, useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export default function useStomp({ topics = [], onEvent }) {
  const [connected, setConnected] = useState(false)
  const clientRef = useRef(null)
  const subscriptionsRef = useRef([])
  const reconnectRef = useRef(0)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-stomp'),
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: Math.min(1000 * Math.pow(2, reconnectRef.current), 30000),
      onConnect: () => {
        setConnected(true)
        reconnectRef.current = 0

        topics.forEach(topic => {
          const sub = client.subscribe(topic, message => {
            try {
              const data = JSON.parse(message.body)
              if (onEvent) onEvent(data, topic)
            } catch (e) {
              console.error('STOMP parse error:', e)
            }
          })
          subscriptionsRef.current.push(sub)
        })
      },
      onDisconnect: () => {
        setConnected(false)
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'])
        setConnected(false)
        reconnectRef.current = Math.min(reconnectRef.current + 1, 5)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe())
      subscriptionsRef.current = []
      client.deactivate()
    }
  }, [])

  const subscribe = useCallback((topic, callback) => {
    if (clientRef.current?.connected) {
      const sub = clientRef.current.subscribe(topic, message => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (e) {
          console.error('STOMP parse error:', e)
        }
      })
      return () => sub.unsubscribe()
    }
  }, [])

  return { connected, subscribe }
}
```

- [ ] **Step 2: Simplify useWebSocket.js to wrap useStomp**

```javascript
import { useState, useEffect, useRef } from 'react'
import useStomp from './useStomp'

export default function useWebSocket() {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState(null)
  const maxEvents = 500
  const seenRef = useRef(new Set())

  const onEvent = (data, topic) => {
    if (topic === '/topic/events') {
      const key = data.timestamp + (data.sessionId || '') + data.type
      if (seenRef.current.has(key)) return
      seenRef.current.add(key)
      setEvents(prev => {
        const next = [data, ...prev]
        return next.slice(0, maxEvents)
      })
    } else if (topic === '/topic/stats') {
      setStats(data)
    }
  }

  const stomp = useStomp({
    topics: ['/topic/events', '/topic/stats'],
    onEvent,
  })

  return { connected: stomp.connected, events, stats }
}
```

### Task 2.3: Create Event Context for Cross-Page State

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\frontend\src\context\EventContext.jsx`

- [ ] **Step 1: Create EventContext**

```jsx
import { createContext, useContext, useReducer } from 'react'

const EventContext = createContext(null)

const initialState = {
  events: [],
  stats: null,
  threats: [],
  mitigations: [],
  sessions: [],
}

function eventReducer(state, action) {
  switch (action.type) {
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events].slice(0, 500) }
    case 'ADD_THREAT':
      return { ...state, threats: [action.payload, ...state.threats].slice(0, 100) }
    case 'ADD_MITIGATION':
      return { ...state, mitigations: [action.payload, ...state.mitigations].slice(0, 200) }
    case 'SET_STATS':
      return { ...state, stats: action.payload }
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload }
    default:
      return state
  }
}

export function EventProvider({ children }) {
  const [state, dispatch] = useReducer(eventReducer, initialState)

  return (
    <EventContext.Provider value={{ state, dispatch }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEventContext() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEventContext must be inside EventProvider')
  return ctx
}
```

---

## Phase 3: Real Time-Series Analytics

### Task 3.1: Create AnalyticsAggregatorService

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\analytics\AnalyticsAggregatorService.java`

- [ ] **Step 1: Create the aggregator service**

```java
package com.botguard.analytics;

import com.botguard.model.EnvelopeEvent;
import com.botguard.model.EventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.TimeUnit;

@Service
public class AnalyticsAggregatorService {
    private static final Logger log = LoggerFactory.getLogger(AnalyticsAggregatorService.class);

    private final StringRedisTemplate redis;

    // Local batching counters (flushed to Redis every 5s)
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong humanRequests = new AtomicLong(0);
    private final AtomicLong botRequests = new AtomicLong(0);
    private final AtomicLong blockedRequests = new AtomicLong(0);
    private final AtomicLong mitigatedRequests = new AtomicLong(0);

    // Risk distribution buffer (local, flushed to Redis ZSET every 60s)
    private final Map<String, AtomicLong> riskBuckets = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> mitigationBuckets = new ConcurrentHashMap<>();

    // Time of last flush for risk/mitigation buckets
    private Instant lastBucketFlush = Instant.now();

    public AnalyticsAggregatorService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void record(EnvelopeEvent event) {
        totalRequests.incrementAndGet();

        Map<String, Object> payload = event.getPayload();
        if (payload == null) return;

        // Bot vs human
        Number score = (Number) payload.get("riskScore");
        if (score != null) {
            if (score.doubleValue() >= 60) {
                botRequests.incrementAndGet();
            } else {
                humanRequests.incrementAndGet();
            }

            // Risk bucket
            String bucket = getRiskBucket(score.doubleValue());
            riskBuckets.computeIfAbsent(bucket, k -> new AtomicLong(0)).incrementAndGet();
        }

        // Mitigation action
        String action = (String) payload.get("mitigationAction");
        if (action != null && !"ALLOW".equals(action)) {
            mitigatedRequests.incrementAndGet();
            if ("TEMP_BLOCK".equals(action) || "RATE_LIMIT".equals(action)) {
                blockedRequests.incrementAndGet();
            }
            mitigationBuckets.computeIfAbsent(action, k -> new AtomicLong(0)).incrementAndGet();
        }
    }

    @Scheduled(fixedRate = 5000) // Flush to Redis every 5 seconds
    public void flushToRedis() {
        long total = totalRequests.getAndSet(0);
        long human = humanRequests.getAndSet(0);
        long bot = botRequests.getAndSet(0);
        long blocked = blockedRequests.getAndSet(0);
        long mitigated = mitigatedRequests.getAndSet(0);

        if (total == 0 && mitigated == 0) return;

        String minuteKey = getCurrentMinuteKey();

        // Increment rolling minute counters in Redis
        redis.opsForHash().increment("analytics:rolling:1m", "total", total);
        redis.opsForHash().increment("analytics:rolling:1m", "human", human);
        redis.opsForHash().increment("analytics:rolling:1m", "bot", bot);
        redis.opsForHash().increment("analytics:rolling:1m", "blocked", blocked);
        redis.opsForHash().increment("analytics:rolling:1m", "mitigated", mitigated);
        redis.expire("analytics:rolling:1m", 120, TimeUnit.SECONDS);
    }

    @Scheduled(fixedRate = 60000) // Roll up to time-series every minute
    public void rollupMinute() {
        // Read and reset rolling counters
        Map<Object, Object> counters = redis.opsForHash().entries("analytics:rolling:1m");
        if (counters == null || counters.isEmpty()) return;

        long epochMinute = Instant.now().getEpochSecond() / 60;
        String minuteStr = String.valueOf(epochMinute);
        String key = "analytics:timeseries:total";

        // Store in ZSET with epoch minute as score
        long total = getLong(counters.get("total"));
        long human = getLong(counters.get("human"));
        long bot = getLong(counters.get("bot"));
        long blocked = getLong(counters.get("blocked"));
        long mitigated = getLong(counters.get("mitigated"));

        String value = String.format("{\"total\":%d,\"human\":%d,\"bot\":%d,\"blocked\":%d,\"mitigated\":%d}",
                total, human, bot, blocked, mitigated);

        redis.opsForZSet().add(key, value, epochMinute);
        redis.expire(key, 86400, TimeUnit.SECONDS); // 24h TTL

        // Flush risk distribution to ZSETs
        riskBuckets.forEach((bucket, count) -> {
            long c = count.getAndSet(0);
            if (c > 0) {
                String riskKey = "analytics:risk:" + bucket;
                redis.opsForZSet().incrementScore(riskKey, minuteStr, c);
                redis.expire(riskKey, 86400, TimeUnit.SECONDS);
            }
        });

        // Flush mitigation distribution to ZSETs
        mitigationBuckets.forEach((action, count) -> {
            long c = count.getAndSet(0);
            if (c > 0) {
                String mitKey = "analytics:mitigation:" + action;
                redis.opsForZSet().incrementScore(mitKey, minuteStr, c);
                redis.expire(mitKey, 86400, TimeUnit.SECONDS);
            }
        });

        // Delete rolling counters for next cycle
        redis.delete("analytics:rolling:1m");
    }

    private String getCurrentMinuteKey() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("UTC"));
        return now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME).substring(0, 16);
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
```

### Task 3.2: Create TimeSeriesService

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\analytics\TimeSeriesService.java`

- [ ] **Step 1: Create query service**

```java
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
        String key = "analytics:timeseries:total";
        Set<ZSetOperations.TypedTuple<String>> results = redis.opsForZSet()
                .rangeByScoreWithScores(key, minEpoch, maxEpoch);
        if (results == null) return List.of();
        return results.stream().map(t -> {
            try {
                Map<String, Object> point = objectMapper.readValue(t.getValue(), new TypeReference<>() {});
                long epochMin = (long) t.getScore();
                point.put("time", epochMin);
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
            Double count = redis.opsForZSet().zCard(key);
            result.add(Map.of("range", range, "count", count != null ? count.longValue() : 0));
        }
        return result;
    }

    public List<Map<String, Object>> getMitigationDistribution() {
        String[] actions = {"ALLOW", "THROTTLE", "DELAY", "CHALLENGE", "BLOCK"};
        List<Map<String, Object>> result = new ArrayList<>();
        for (String action : actions) {
            String key = "analytics:mitigation:" + action;
            Double count = redis.opsForZSet().zCard(key);
            result.add(Map.of("name", action, "value", count != null ? count.longValue() : 0));
        }
        return result;
    }
}
```

### Task 3.3: Create RealtimeStatsService for WebSocket Broadcasting

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\analytics\RealtimeStatsService.java`

- [ ] **Step 1: Create stats broadcast service**

```java
package com.botguard.analytics;

import com.botguard.model.EnvelopeEvent;
import com.botguard.model.EventType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class RealtimeStatsService {
    private static final Logger log = LoggerFactory.getLogger(RealtimeStatsService.class);

    private final AnalyticsService analyticsService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public RealtimeStatsService(AnalyticsService analyticsService,
                                SimpMessagingTemplate messagingTemplate,
                                ObjectMapper objectMapper) {
        this.analyticsService = analyticsService;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedRate = 2000)
    public void broadcastStats() {
        try {
            Map<String, Object> stats = analyticsService.getStatsMap();
            EnvelopeEvent envelope = new EnvelopeEvent(
                    EventType.ANALYTICS, null,
                    com.botguard.model.SeverityLevel.LOW,
                    stats
            );
            messagingTemplate.convertAndSend("/topic/stats", envelope);
        } catch (Exception e) {
            log.error("Failed to broadcast stats: {}", e.getMessage());
        }
    }
}
```

### Task 3.4: Add Time-Series Endpoints to ApiController

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\controller\ApiController.java`

- [ ] **Step 1: Add 4 new analytics endpoints**

Inject `TimeSeriesService` and add:

```java
@GetMapping("/analytics/timeseries")
public ResponseEntity<?> getTimeSeries(@RequestParam(defaultValue = "30") int minutes) {
    return ResponseEntity.ok(Map.of("series", timeSeriesService.getTimeSeries(minutes)));
}

@GetMapping("/analytics/bot-vs-human")
public ResponseEntity<?> getBotVsHuman(@RequestParam(defaultValue = "60") int minutes) {
    return ResponseEntity.ok(timeSeriesService.getBotVsHuman(minutes));
}

@GetMapping("/analytics/risk-distribution")
public ResponseEntity<?> getRiskDistribution() {
    return ResponseEntity.ok(Map.of("distribution", timeSeriesService.getRiskDistribution()));
}

@GetMapping("/analytics/mitigation-distribution")
public ResponseEntity<?> getMitigationDistribution() {
    return ResponseEntity.ok(Map.of("distribution", timeSeriesService.getMitigationDistribution()));
}
```

### Task 3.5: Update Frontend Charts to Use Real Data

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\src\charts\RequestsOverTime.jsx`
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\src\charts\BotVsHumanChart.jsx`
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\src\charts\RiskHistogram.jsx`
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\src\charts\MitigationChart.jsx`
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\src\pages\Dashboard.jsx`
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\src\pages\Analytics.jsx`

- [ ] **Step 1: Update RequestsOverTime to remove hardcoded fallback**

Remove the `data` constant fallback. Accept only prop data. Add loading skeleton:

```jsx
export default function RequestsOverTime({ data: propData, loading }) {
  if (loading) return <div className="rounded-3xl p-6 border border-white/5 shadow-2xl" style={{background:'#171A23'}}><div className="h-4 w-32 bg-white/5 rounded mb-5" /><div className="h-[260px] bg-white/5 rounded animate-pulse" /></div>

  if (!propData || propData.length === 0) return (
    <div className="rounded-3xl p-6 border border-white/5 shadow-2xl text-center" style={{background:'#171A23'}}>
      <p className="text-text-muted text-sm font-medium py-12">Waiting for data...</p>
    </div>
  )

  // ... use propData directly
}
```

- [ ] **Step 2: Update Dashboard to fetch real timeseries data**

Add fetch calls for all 4 chart endpoints:

```javascript
const [timeseries, setTimeseries] = useState(null)
const [botVsHuman, setBotVsHuman] = useState(null)
const [riskDist, setRiskDist] = useState(null)
const [mitDist, setMitDist] = useState(null)
const [chartLoading, setChartLoading] = useState(true)

useEffect(() => {
  Promise.all([
    fetch('/api/analytics/timeseries?minutes=30').then(r => r.json()),
    fetch('/api/analytics/bot-vs-human?minutes=60').then(r => r.json()),
    fetch('/api/analytics/risk-distribution').then(r => r.json()),
    fetch('/api/analytics/mitigation-distribution').then(r => r.json()),
  ]).then(([ts, bvh, rd, md]) => {
    setTimeseries(ts.series)
    setBotVsHuman(bvh)
    setRiskDist(rd.distribution)
    setMitDist(md.distribution)
    setChartLoading(false)
  }).catch(() => setChartLoading(false))
}, [])
```

---

## Phase 4: Honeypot Analytics

### Task 4.1: Create HoneypotAnalyticsService

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\honeypot\HoneypotAnalyticsService.java`

- [ ] **Step 1: Create aggregate service**

```java
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

    private static final String TRAP_KEY_PREFIX = "honeypot:stats:";
    private static final String OFFENDERS_KEY = "honeypot:offenders";

    public HoneypotAnalyticsService(StringRedisTemplate redis, HoneypotConfig honeypotConfig) {
        this.redis = redis;
        this.honeypotConfig = honeypotConfig;
    }

    public Map<String, Object> getStats() {
        List<String> trapNames = honeypotConfig.getStaticRoutes();
        List<Map<String, Object>> traps = new ArrayList<>();
        long totalHits = 0;
        Set<String> allSessions = new HashSet<>();

        for (String name : trapNames) {
            String key = TRAP_KEY_PREFIX + name;
            Map<Object, Object> data = redis.opsForHash().entries(key);
            if (data == null || data.isEmpty()) {
                // Return trap with zero stats if no data yet
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

        // Top offenders
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

        long totalUniqueSessions = 0; // would need a SET or HyperLogLog for accuracy
        double conversionRate = totalHits > 0
                ? (double) traps.stream().mapToLong(t -> (Integer) t.get("blocked")).sum() / totalHits
                : 0;

        return Map.of(
                "traps", traps,
                "topOffenders", topOffenders,
                "totalHits", totalHits,
                "totalUniqueSessions", totalUniqueSessions,
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
```

### Task 4.2: Add Honeypot Stats Endpoint

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\controller\HoneypotController.java`

- [ ] **Step 1: Add GET /api/honeypots/stats**

```java
@GetMapping("/api/honeypots/stats")
public ResponseEntity<?> getHoneypotStats() {
    return ResponseEntity.ok(honeypotAnalyticsService.getStats());
}
```

### Task 4.3: Update HoneypotMonitor Page

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\src\pages\HoneypotMonitor.jsx`

- [ ] **Step 1: Replace hardcoded honeypotData with API fetch**

```javascript
const [honeypotStats, setHoneypotStats] = useState(null)

useEffect(() => {
  fetch('/api/honeypots/stats')
    .then(r => r.json()).then(setHoneypotStats).catch(() => {})
  // ... poll interval
}, [])
```

---

## Phase 5: Geo-IP Enrichment

### Task 5.1: Create GeoIpService with MaxMind

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\geo\GeoLocation.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\geo\GeoIpService.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\geo\GeoEnricher.java`
- Add `GeoLite2-City.mmdb` to resources (download required)

- [ ] **Step 1: Create GeoLocation DTO**

```java
package com.botguard.geo;

public class GeoLocation {
    private String country;
    private String countryCode;
    private String city;
    private long asn;
    private String isp;
    private double latitude;
    private double longitude;

    // Getters + setters
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public long getAsn() { return asn; }
    public void setAsn(long asn) { this.asn = asn; }
    public String getIsp() { return isp; }
    public void setIsp(String isp) { this.isp = isp; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
}
```

- [ ] **Step 2: Create GeoIpService**

```java
package com.botguard.geo;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.exception.GeoIp2Exception;
import com.maxmind.geoip2.model.CityResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class GeoIpService {
    private static final Logger log = LoggerFactory.getLogger(GeoIpService.class);
    private static final String CACHE_PREFIX = "geo:ip:";
    private static final long CACHE_TTL = 86400; // 24h

    private DatabaseReader reader;
    private final StringRedisTemplate redis;
    private final String dbPath;

    public GeoIpService(StringRedisTemplate redis,
                        @Value("${geoip.database.path:classpath:geo/GeoLite2-City.mmdb}") String dbPath) {
        this.redis = redis;
        this.dbPath = dbPath;
    }

    @PostConstruct
    public void init() {
        try {
            File database = new File(dbPath.replace("classpath:", "src/main/resources/"));
            if (database.exists()) {
                reader = new DatabaseReader.Builder(database).build();
                log.info("GeoIP database loaded: {}", dbPath);
            } else {
                log.warn("GeoIP database not found at {}. Geo enrichment disabled.", dbPath);
            }
        } catch (IOException e) {
            log.error("Failed to load GeoIP database: {}", e.getMessage());
        }
    }

    public GeoLocation lookup(String ip) {
        if (reader == null || ip == null || ip.isBlank()) return null;

        // Check cache
        String cacheKey = CACHE_PREFIX + ip;
        Map<Object, Object> cached = redis.opsForHash().entries(cacheKey);
        if (cached != null && !cached.isEmpty()) {
            GeoLocation loc = new GeoLocation();
            loc.setCountry((String) cached.get("country"));
            loc.setCountryCode((String) cached.get("countryCode"));
            loc.setCity((String) cached.get("city"));
            loc.setAsn(cached.get("asn") != null ? Long.parseLong((String) cached.get("asn")) : 0);
            loc.setIsp((String) cached.get("isp"));
            loc.setLatitude(cached.get("lat") != null ? Double.parseDouble((String) cached.get("lat")) : 0);
            loc.setLongitude(cached.get("lon") != null ? Double.parseDouble((String) cached.get("lon")) : 0);
            return loc;
        }

        try {
            InetAddress address = InetAddress.getByName(ip);
            CityResponse response = reader.city(address);

            GeoLocation loc = new GeoLocation();
            loc.setCountry(response.getCountry().getName());
            loc.setCountryCode(response.getCountry().getIsoCode());
            loc.setCity(response.getCity().getName());
            loc.setLatitude(response.getLocation().getLatitude());
            loc.setLongitude(response.getLocation().getLongitude());

            // Cache in Redis
            redis.opsForHash().putAll(cacheKey, Map.of(
                    "country", loc.getCountry() != null ? loc.getCountry() : "Unknown",
                    "countryCode", loc.getCountryCode() != null ? loc.getCountryCode() : "XX",
                    "city", loc.getCity() != null ? loc.getCity() : "Unknown",
                    "asn", String.valueOf(loc.getAsn()),
                    "isp", loc.getIsp() != null ? loc.getIsp() : "Unknown",
                    "lat", String.valueOf(loc.getLatitude()),
                    "lon", String.valueOf(loc.getLongitude())
            ));
            redis.expire(cacheKey, CACHE_TTL, TimeUnit.SECONDS);

            return loc;

        } catch (IOException | GeoIp2Exception e) {
            // Private/reserved IP, just skip
            return null;
        }
    }
}
```

- [ ] **Step 3: Create GeoEnricher**

```java
package com.botguard.geo;

import com.botguard.model.EnvelopeEvent;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class GeoEnricher {
    private final GeoIpService geoIpService;

    public GeoEnricher(GeoIpService geoIpService) {
        this.geoIpService = geoIpService;
    }

    public void enrich(EnvelopeEvent event) {
        if (event.getPayload() == null) return;
        String ip = (String) event.getPayload().get("ipAddress");
        if (ip == null) return;
        GeoLocation geo = geoIpService.lookup(ip);
        if (geo != null) {
            event.getPayload().put("geo_country", geo.getCountry());
            event.getPayload().put("geo_countryCode", geo.getCountryCode());
            event.getPayload().put("geo_city", geo.getCity());
            event.getPayload().put("geo_asn", String.valueOf(geo.getAsn()));
            event.getPayload().put("geo_isp", geo.getIsp() != null ? geo.getIsp() : "Unknown");
        }
    }
}
```

- [ ] **Step 4: Wire GeoEnricher into EventBus flow**

Add to `RequestInterceptor` after building the envelope:
```java
geoEnricher.enrich(envelopeEvent);
```

### Task 5.2: Add Geo Analytics Endpoint

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\controller\ApiController.java`

- [ ] **Step 1: Add GET /api/analytics/geo**

```java
@GetMapping("/analytics/geo")
public ResponseEntity<?> getGeoAnalytics() {
    // Aggregate geo data from Redis time-series
    // This reads the analytics:timeseries:total ZSET and enriches with IP-geo data
    // For a real implementation, maintain geo:country:US ZSET with timestamp scores
    // and aggregate from there
    return ResponseEntity.ok(timeSeriesService.getGeoBreakdown());
}
```

---

## Phase 6: Adaptive Risk Scoring Engine

### Task 6.1: Create Signal Interfaces and Implementations

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\scoring\WeightedSignal.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\scoring\RequestVelocitySignal.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\scoring\HoneypotSignal.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\scoring\FingerprintSignal.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\scoring\BehaviorEntropySignal.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\scoring\ReputationSignal.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\scoring\WeightedSignalRegistry.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\scoring\RiskScoringEngine.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\scoring\ConfidenceCalculator.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\model\ScoreExplanation.java`

- [ ] **Step 1: Create WeightedSignal interface**

```java
package com.botguard.scoring;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;
import com.botguard.model.BotScore;

public interface WeightedSignal {
    String getName();
    double getWeight();
    double computeScore(FeatureSnapshot features, SessionInfo session);
    boolean isEnabled();
    String getDescription();
}
```

- [ ] **Step 2: Create RequestVelocitySignal**

```java
package com.botguard.scoring;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;

public class RequestVelocitySignal implements WeightedSignal {
    private double weight = 0.3;
    private boolean enabled = true;

    public void setWeight(double weight) { this.weight = weight; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    @Override public String getName() { return "requestVelocity"; }
    @Override public double getWeight() { return weight; }
    @Override public boolean isEnabled() { return enabled; }
    @Override public String getDescription() { return "Request rate and timing variance"; }

    @Override
    public double computeScore(FeatureSnapshot features, SessionInfo session) {
        double rpm = features.getRpm();
        double intervalVariance = features.getIntervalVariance();
        // Higher RPM + lower variance = more bot-like
        double rpmScore = Math.min(rpm / 60.0, 1.0) * 100;
        double varianceScore = Math.max(0, 100 - intervalVariance * 10);
        return (rpmScore * 0.6) + (varianceScore * 0.4);
    }
}
```

- [ ] **Step 3: Create remaining signals** (same pattern, different weights/formulas)

HoneypotSignal (weight 0.5): score = min(honeypotHits * 25, 100)

FingerprintSignal (weight 0.4): score = suspicious UA = 70, headless = 90, missing headers = 50, else 10

BehaviorEntropySignal (weight 0.2): score = max(0, 100 - entropy * 20)

ReputationSignal (weight 0.3): score = (1 - reputationScore) * 100

- [ ] **Step 4: Create WeightedSignalRegistry**

```java
package com.botguard.scoring;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WeightedSignalRegistry {
    private static final Logger log = LoggerFactory.getLogger(WeightedSignalRegistry.class);
    private static final String WEIGHTS_KEY = "scoring:weights:global";

    private final StringRedisTemplate redis;
    private final Map<String, WeightedSignal> signals = new ConcurrentHashMap<>();
    private final Map<String, Double> weightOverrides = new ConcurrentHashMap<>();

    public WeightedSignalRegistry(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @PostConstruct
    public void registerDefaults() {
        register(new RequestVelocitySignal());
        register(new HoneypotSignal());
        register(new FingerprintSignal());
        register(new BehaviorEntropySignal());
        register(new ReputationSignal());
        loadWeights();
    }

    public void register(WeightedSignal signal) {
        signals.put(signal.getName(), signal);
    }

    public WeightedSignal get(String name) { return signals.get(name); }

    public List<WeightedSignal> getAll() { return List.copyOf(signals.values()); }

    public List<WeightedSignal> getEnabled() {
        return signals.values().stream().filter(WeightedSignal::isEnabled).toList();
    }

    public void loadWeights() {
        Map<Object, Object> stored = redis.opsForHash().entries(WEIGHTS_KEY);
        if (stored == null || stored.isEmpty()) {
            // Store defaults
            for (WeightedSignal s : signals.values()) {
                redis.opsForHash().put(WEIGHTS_KEY, s.getName(), String.valueOf(s.getWeight()));
            }
            return;
        }
        stored.forEach((name, weightStr) -> {
            String nameStr = (String) name;
            WeightedSignal signal = signals.get(nameStr);
            if (signal != null && weightStr instanceof String) {
                try {
                    double w = Double.parseDouble((String) weightStr);
                    weightOverrides.put(nameStr, w);
                } catch (NumberFormatException e) {
                    log.warn("Invalid weight for {}: {}", nameStr, weightStr);
                }
            }
        });
    }

    public double getEffectiveWeight(String name) {
        return weightOverrides.getOrDefault(name, signals.getOrDefault(name, null) != null ? signals.get(name).getWeight() : 0);
    }

    @Scheduled(fixedRate = 30000)
    public void refreshWeights() {
        loadWeights();
    }
}
```

- [ ] **Step 5: Create RiskScoringEngine**

```java
package com.botguard.scoring;

import com.botguard.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class RiskScoringEngine {
    private final WeightedSignalRegistry registry;
    private final ConfidenceCalculator confidenceCalculator;

    public RiskScoringEngine(WeightedSignalRegistry registry, ConfidenceCalculator confidenceCalculator) {
        this.registry = registry;
        this.confidenceCalculator = confidenceCalculator;
    }

    public BotScore evaluate(FeatureSnapshot features, SessionInfo session) {
        List<WeightedSignal> enabledSignals = registry.getEnabled();
        List<ScoreExplanation> contributions = new ArrayList<>();
        double totalWeight = 0;
        double weightedSum = 0;

        for (WeightedSignal signal : enabledSignals) {
            double rawScore = signal.computeScore(features, session);
            double effectiveWeight = registry.getEffectiveWeight(signal.getName());
            double normalizedScore = Math.min(100, Math.max(0, rawScore)) / 100.0;
            double impact = normalizedScore * effectiveWeight * 100;

            contributions.add(new ScoreExplanation(
                    signal.getName(),
                    effectiveWeight,
                    Math.min(100, Math.max(0, rawScore)),
                    normalizedScore,
                    Math.min(100, Math.max(0, impact))
            ));

            totalWeight += effectiveWeight;
            weightedSum += normalizedScore * effectiveWeight;
        }

        double finalScore = totalWeight > 0
                ? Math.min(100, Math.max(0, (weightedSum / totalWeight) * 100))
                : 0;
        double confidence = confidenceCalculator.calculate(contributions);
        RiskLevel level = RiskLevel.fromScore(finalScore);
        MitigationAction recommendation = level.getDefaultAction();

        return new BotScore(
                session.getSessionId(),
                Math.round(finalScore * 10.0) / 10.0,
                level,
                Map.of("signals", contributions.stream().map(c -> Map.of(
                        "signal", c.getSignalName(),
                        "weight", c.getWeight(),
                        "rawScore", c.getRawScore(),
                        "impact", c.getImpact()
                )).toList()),
                recommendation
        );
    }
}
```

- [ ] **Step 6: Create ConfidenceCalculator**

```java
package com.botguard.scoring;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ConfidenceCalculator {
    public double calculate(List<ScoreExplanation> contributions) {
        if (contributions == null || contributions.isEmpty()) return 0;
        double mean = contributions.stream().mapToDouble(ScoreExplanation::getNormalizedScore).average().orElse(0);
        double variance = contributions.stream()
                .mapToDouble(c -> Math.pow(c.getNormalizedScore() - mean, 2))
                .average().orElse(0);
        // Low variance = high confidence (signals agree)
        // High variance = lower confidence (signals disagree)
        double maxVariance = 0.25; // max possible variance for 0-1 range
        return Math.min(1.0, Math.max(0, 1.0 - (variance / maxVariance)));
    }
}
```

- [ ] **Step 7: Create ScoreExplanation model**

```java
package com.botguard.model;

public class ScoreExplanation {
    private String signalName;
    private double weight;
    private double rawScore;
    private double normalizedScore;
    private double impact;

    public ScoreExplanation(String signalName, double weight, double rawScore, double normalizedScore, double impact) {
        this.signalName = signalName;
        this.weight = weight;
        this.rawScore = rawScore;
        this.normalizedScore = normalizedScore;
        this.impact = impact;
    }

    public String getSignalName() { return signalName; }
    public double getWeight() { return weight; }
    public double getRawScore() { return rawScore; }
    public double getNormalizedScore() { return normalizedScore; }
    public double getImpact() { return impact; }
}
```

### Task 6.2: Create Scoring Config Controller

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\controller\ScoringConfigController.java`

- [ ] **Step 1: Create dynamic weights endpoint**

```java
package com.botguard.controller;

import com.botguard.scoring.WeightedSignal;
import com.botguard.scoring.WeightedSignalRegistry;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ScoringConfigController {
    private final WeightedSignalRegistry registry;
    private final StringRedisTemplate redis;
    private static final String WEIGHTS_KEY = "scoring:weights:global";

    public ScoringConfigController(WeightedSignalRegistry registry, StringRedisTemplate redis) {
        this.registry = registry;
        this.redis = redis;
    }

    @GetMapping("/scoring-weights")
    public ResponseEntity<?> getWeights() {
        List<Map<String, Object>> signals = registry.getAll().stream()
                .map(s -> Map.<String, Object>of(
                        "name", s.getName(),
                        "weight", registry.getEffectiveWeight(s.getName()),
                        "enabled", s.isEnabled(),
                        "description", s.getDescription()
                )).toList();
        return ResponseEntity.ok(Map.of("signals", signals));
    }

    @PutMapping("/scoring-weights")
    public ResponseEntity<?> updateWeights(@RequestBody Map<String, Object> body) {
        Object signalsRaw = body.get("signals");
        if (signalsRaw instanceof List) {
            for (Object o : (List<?>) signalsRaw) {
                if (o instanceof Map) {
                    Map<?, ?> signal = (Map<?, ?>) o;
                    String name = (String) signal.get("name");
                    Number weight = (Number) signal.get("weight");
                    if (name != null && weight != null) {
                        redis.opsForHash().put(WEIGHTS_KEY, name, String.valueOf(weight.doubleValue()));
                    }
                }
            }
        }
        registry.loadWeights();
        return ResponseEntity.ok(Map.of("status", "updated"));
    }
}
```

---

## Phase 7: Attack Replay System

### Task 7.1: Create ReplayService + ReplayController

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\replay\ReplayService.java`
- Create: `C:\Users\raghu\Desktop\botguard\backend\src\main\java\com\botguard\controller\ReplayController.java`

- [ ] **Step 1: Create ReplayService**

```java
package com.botguard.replay;

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
        if (sessionId == null) return Map.of("error", "sessionId required");

        String streamKey = "replay:stream:" + sessionId;
        List<Map<String, Object>> records = new ArrayList<>();

        // Read from Redis Stream
        var entries = redis.opsForStream().read(streamKey);
        if (entries != null) {
            for (var entry : entries) {
                Map<String, Object> record = new HashMap<>();
                entry.getValue().forEach((k, v) -> record.put((String) k, v));
                records.add(record);
            }
        }

        // Sort by sequence
        records.sort(Comparator.comparing(r -> r.getOrDefault("seq", "0")));

        // Compute score progression
        List<Map<String, Object>> scoreProgression = records.stream()
                .filter(r -> r.containsKey("payload"))
                .map(r -> {
                    try {
                        Map<String, Object> payload = objectMapper.readValue(
                                (String) r.get("payload"), Map.class);
                        return Map.<String, Object>of(
                                "seq", r.get("seq"),
                                "score", payload.getOrDefault("riskScore", 0)
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
```

- [ ] **Step 2: Create ReplayController**

```java
package com.botguard.controller;

import com.botguard.replay.ReplayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/replay")
public class ReplayController {
    private final ReplayService replayService;

    public ReplayController(ReplayService replayService) {
        this.replayService = replayService;
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSessionReplay(@PathVariable String sessionId) {
        return ResponseEntity.ok(replayService.getSessionReplay(sessionId));
    }

    @GetMapping
    public ResponseEntity<?> getRecentSessions(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(Map.of("sessions", replayService.getRecentSessions(limit)));
    }
}
```

---

## Phase 8: Frontend SOC Dashboard Polish

### Task 8.1: Install Frontend Animation Dependencies

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\package.json`

- [ ] **Step 1: Install Framer Motion + Lucide React**

```bash
npm install framer-motion lucide-react
```

### Task 8.2: Create PulseIndicator Component

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\frontend\src\components\PulseIndicator.jsx`

- [ ] **Step 1: Create animated pulse dot**

```jsx
export default function PulseIndicator({ active = true, color = '#22C55E' }) {
  return (
    <span className="relative inline-flex">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {active && (
        <span
          className="absolute top-0 left-0 w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: color, opacity: 0.5 }}
        />
      )}
    </span>
  )
}
```

### Task 8.3: Create LiveThreatFeed Component

**Files:**
- Create: `C:\Users\raghu\Desktop\botguard\frontend\src\components\LiveThreatFeed.jsx`

- [ ] **Step 1: Create scrolling threat feed**

```jsx
import { motion, AnimatePresence } from 'framer-motion'
import RiskBadge from './RiskBadge'

export default function LiveThreatFeed({ threats = [], maxHeight = 400 }) {
  return (
    <div className="rounded-3xl p-5 border border-white/5 shadow-2xl overflow-hidden" style={{ background: '#171A23', maxHeight }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-white tracking-wide uppercase">Live Threats</h3>
        <span className="text-[10px] font-semibold text-danger flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          {threats.length} active
        </span>
      </div>
      <div className="space-y-1 overflow-y-auto" style={{ maxHeight: maxHeight - 60 }}>
        <AnimatePresence>
          {threats.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs font-medium">No active threats</div>
          ) : (
            threats.slice(0, 20).map((threat, i) => (
              <motion.div
                key={threat.timestamp + '-' + i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]"
              >
                <div className="flex items-center gap-2">
                  <RiskBadge score={threat.payload?.riskScore} size="sm" />
                  <span className="text-[10px] font-medium text-text-secondary">{threat.sessionId?.substring(0, 10)}...</span>
                </div>
                <span className="text-[9px] font-medium text-text-muted">
                  {threat.payload?.mitigationAction || ''}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
```

### Task 8.4: Add Framer Motion to App.jsx

**Files:**
- Modify: `C:\Users\raghu\Desktop\botguard\frontend\src\App.jsx`

- [ ] **Step 1: Wrap routes with AnimatePresence**

```jsx
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
// ... other imports

export default function App() {
  const location = useLocation()
  // ...

  return (
    <div className="min-h-screen" style={{ background: '#0F1117' }}>
      <Navbar connected={connected} />
      <main className="ml-64 p-6 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Dashboard wsConnected={connected} />} />
              <Route path="/threats" element={<ThreatFeed />} />
              <Route path="/sessions" element={<SessionInspector />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/honeypots" element={<HoneypotMonitor />} />
              <Route path="/mitigations" element={<MitigationView />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
```

---

## Verification

### Backend Verification
1. Start Redis (WSL docker)
2. Start Spring Boot backend
3. Verify: `GET /api/analytics/timeseries?minutes=30` returns `{ "series": [] }` (empty, no data yet)
4. Start simulators: `POST /api/simulator/start`
5. Wait 60s, verify timeseries returns data
6. Verify: `GET /api/analytics/bot-vs-human` returns counts
7. Verify: `GET /api/analytics/risk-distribution` returns distribution
8. Verify: `GET /api/analytics/mitigation-distribution` returns distribution
9. Verify: `GET /api/honeypots/stats` returns trap data
10. Verify WebSocket connects at `/ws-stomp` (check browser console)
11. Verify: `GET /api/config/scoring-weights` returns signals
12. Verify: `GET /api/replay/{sessionId}` returns replay data

### Frontend Verification
1. `npm run dev`
2. Dashboard loads with 4 charts showing real data (not "Waiting for data...")
3. ThreatFeed shows live events
4. HoneypotMonitor shows real trap stats
5. MitigationView shows real mitigation distribution
6. Page transitions animate smoothly
7. Connection indicator shows connected
8. No console errors

### Redis Verification
```bash
redis-cli KEYS "analytics:*"    # Should show time-series keys
redis-cli KEYS "mitigation:*"   # Should show mitigation keys
redis-cli KEYS "honeypot:*"     # Should show honeypot keys
redis-cli KEYS "replay:*"      # Should show replay streams
redis-cli KEYS "scoring:*"     # Should show scoring weights
```
