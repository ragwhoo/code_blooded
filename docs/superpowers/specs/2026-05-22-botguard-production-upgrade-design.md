# BotGuard Production-Grade Upgrade — Architecture & Design

## Overview

Transform the existing anti-bot detection platform into a production-grade cybersecurity analytics platform with distributed state, real-time streaming, adaptive scoring, geo-intelligence, and SOC-style dashboard.

## Architecture Principles

- **Event-Driven**: All detection/mitigation/analytics events flow through an Event Bus (Spring `ApplicationEventPublisher`), decoupling producers from consumers
- **Distributed State**: All persistent state in Redis with TTL — zero in-memory caches
- **Event Envelope**: Unified message format for all WebSocket streams, replay system, and analytics pipeline
- **Batched Writes**: Local counters flush periodically to Redis, not per-request writes
- **Rolling Windows**: Time-series at 1m/5m/15m/1h granularity using ZSET epoch-minute scores

---

## 1. Event Bus & Event Envelope Architecture

### Event Bus

Spring `ApplicationEventPublisher` decouples all subsystems:

```
RequestInterceptor
  → publishes DetectionEvent
    → EventBus
      ├── AnalyticsService (counters, aggregations)
      ├── MitigationEngine (action → Redis)
      ├── ReplayRecorder (event → Redis Streams)
      ├── WebSocketPublisher (STOMP topics)
      └── GeoEnricher (IP lookup → enrich event)
```

### Event Envelope

Unified JSON envelope for ALL events (WebSocket, replay, analytics):

```json
{
  "type": "DETECTION|MITIGATION|HONEYPOT|REPUTATION|SESSION|ANALYTICS",
  "version": "1.0",
  "timestamp": "2026-05-22T10:45:00.000Z",
  "sessionId": "abc123",
  "tenantId": "default",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "payload": {
    "riskScore": 72,
    "confidence": 0.85,
    "level": "LIKELY_BOT",
    "mitigationAction": "CHALLENGE",
    "ipAddress": "203.0.113.42",
    "geo": { "country": "US", "city": "San Jose", "asn": 15169, "isp": "Google Cloud" },
    "signals": [
      { "name": "requestVelocity", "weight": 0.3, "contribution": 21.6 },
      { "name": "honeypotHits", "weight": 0.5, "contribution": 25.0 }
    ],
    "features": { "rpm": 45, "entropy": 2.1, "sequentialRatio": 0.8 }
  },
  "metadata": {
    "source": "RequestInterceptor|Simulator|HoneypotService",
    "processingTime": 12
  }
}
```

---

## 2. Redis Schema

### 2.1 Index Sets (fast lookup)

```
mitigation:index:blockedIps          → SET [ip, ip, ...]
mitigation:index:highRiskSessions    → SET [sessionId, ...]
honeypot:offenders:index            → SortedSet [sessionId → hitCount]
```

### 2.2 Mitigation State (Replaces in-memory)

```
mitigation:ip:{ip}              → Hash { action, score, escalated, blockedAt, expiresAt, asn, country }
mitigation:session:{sessionId}  → Hash { action, fingerprint, score, count, escalated, lastPath }
mitigation:fingerprint:{hash}   → Hash { action, score, escalated, hitCount, firstSeen }
mitigation:escalations:{sessionId} → SortedSet [timestamp → action]
```

TTL: IP bans 24h, session actions 1h, fingerprint blocks 72h.

### 2.3 Time-Series Analytics

```
analytics:timeseries:{metric}        → ZSET [epochMinute → serialized metric JSON]
analytics:risk:{range}              → ZSET [epochMinute → count]
analytics:mitigation:{action}       → ZSET [epochMinute → count]
analytics:rolling:1m:{metric}       → ZSET (current minute window)
analytics:rolling:5m:{metric}       → ZSET (5-minute aggregated)
analytics:rolling:15m:{metric}      → ZSET (15-minute aggregated)
analytics:rolling:1h:{metric}       → ZSET (hour aggregated)
```

Metrics stored: `total`, `human`, `bot`, `blocked`, `mitigated`, `avgScore`, `avgConfidence`

### 2.4 Geo-IP Cache

```
geo:ip:{ip} → Hash { country, city, asn, isp, lat, lon, cached }  (TTL 24h)
```

### 2.5 Honeypot Analytics

```
honeypot:stats:{trapName}       → Hash { hits, uniqueSessions, blocked, challenged, lastTriggered }
honeypot:offenders              → SortedSet [sessionId → hitCount]
honeypot:traps:index            → SET [trapName, ...]
```

### 2.6 Adaptive Scoring

```
scoring:registry:{signalName} → Hash { weight, thresholdEnabled, enabled, minScore, maxScore }
scoring:weights:global         → Hash { signalName → weight }
scoring:history:{sessionId}    → ZSET [timestamp → score]
```

### 2.7 Replay (Redis Streams)

```
replay:stream:{sessionId} → Redis Stream (maxlen ~10000, TTL 24h)
replay:index               → SortedSet [timestamp → sessionId]
```

### 2.8 Analytics Batched Counters

```
analytics:buffer:{instanceId} → Hash { total, human, bot, blocked, mitigated }  (TTL 60s)
```

Local `AtomicLong` counters flush to Redis every 5s via `@Scheduled`.

---

## 3. Sequential Build Phases

### Phase 1: Redis Persistent Mitigation + Event Bus + Event Envelope

**Backend files to create/modify:**

| File | Action | Purpose |
|------|--------|---------|
| `model/EnvelopeEvent.java` | Create | Unified event envelope with type, timestamp, severity, payload |
| `model/EventType.java` | Create | Enum: DETECTION, MITIGATION, HONEYPOT, REPUTATION, SESSION, ANALYTICS |
| `model/SeverityLevel.java` | Create | Enum: LOW, MEDIUM, HIGH, CRITICAL |
| `event/EventBusService.java` | Create | Publishes events via ApplicationEventPublisher |
| `event/DetectionEvent.java` | Create | Spring ApplicationEvent subclass |
| `listener/MitigationEventListener.java` | Create | Listens for DetectionEvents, applies mitigations, writes to Redis |
| `listener/AnalyticsEventListener.java` | Create | Listens for events, bumps local counters |
| `listener/ReplayEventListener.java` | Create | Listens for events, records to Redis Streams |
| `listener/WebSocketEventListener.java` | Create | Listens for events, publishes to STOMP topics |
| `mitigation/MitigationEngine.java` | Rewrite | Replace in-memory maps with Redis Hash operations + index sets |
| `config/RedisConfig.java` | Modify | Add Redis Stream support, index templates |
| `interceptor/RequestInterceptor.java` | Modify | Publish DetectionEvents instead of direct calls |

**Redis index management:**
```java
// On block
stringRedisTemplate.opsForSet().add("mitigation:index:blockedIps", ip);
// On unblock / TTL expiry removes from set via @Scheduled cleanup
stringRedisTemplate.opsForSet().remove("mitigation:index:blockedIps", ip);
```

### Phase 2: Real WebSocket Streaming

**Backend changes:**

| File | Action | Purpose |
|------|--------|---------|
| `websocket/WebSocketConfig.java` | Rewrite | STOMP over SockJS at `/ws-stomp`, topic segmentation, heartbeats |
| `websocket/StompController.java` | Create | Maps STOMP destinations to services |
| `listener/WebSocketEventListener.java` | Create | Receives events → publishes to `/topic/events`, `/topic/stats`, `/topic/sessions` |

**STOMP Broker:**
```java
registry.enableSimpleBroker("/topic", "/queue");
registry.setApplicationDestinationPrefixes("/app");
registry.setHeartbeatReceived(10000); // client → server
registry.setHeartbeatSent(10000);     // server → client
```

**Topics:**
- `/topic/events` — all detection/mitigation/honeypot events (envelope format)
- `/topic/stats` — aggregated stats broadcast every 2s
- `/topic/sessions` — session creation/update/expiry
- `/topic/threats` — HIGH/CRITICAL severity events only
- `/topic/mitigations` — mitigation actions only

**Frontend changes:**

| File | Action | Purpose |
|------|--------|---------|
| `hooks/useStomp.js` | Create | STOMP + SockJS hook with auto-reconnect, heartbeat, subscriptions |
| `hooks/useWebSocket.js` | Rewrite | Thin wrapper around useStomp for backward compat |
| `package.json` | Modify | Add `@stomp/stompjs`, `sockjs-client` |

**useStomp hook spec:**
```js
const { connected, subscribe, lastEvent, events, stats } = useStomp({
  topics: ['/topic/events', '/topic/stats'],
  onEvent: (envelope) => { /* reducer */ },
  heartbeat: 10000,
  reconnectDelay: 1000,  // start at 1s
  maxReconnectDelay: 30000,  // cap at 30s exponential backoff
})
```

### Phase 3: Real Time-Series Analytics

**Backend files:**

| File | Action | Purpose |
|------|--------|---------|
| `analytics/AnalyticsAggregatorService.java` | Create | `@Scheduled(fixedRate=60000)` — rolls up minute buckets, aggregates |
| `analytics/TimeSeriesService.java` | Create | Query methods for all time-series endpoints |
| `analytics/RealtimeStatsService.java` | Create | 2s-interval stats broadcasting via WebSocket |
| `controller/AnalyticsController.java` | Refactor | Add 4 new endpoints |

**Aggregation pipeline:**
```
Local counters (AtomicLong)
  → @Scheduled flush every 5s → Redis ZSET analytics:rolling:1m:total
  → @Scheduled rollup every 60s → analytics:timeseries:total ZSET
  → @Scheduled rollup every 5min → analytics:rolling:5m:total
```

**API responses:**

`GET /api/analytics/timeseries?minutes=30&granularity=1m`:
```json
{
  "series": [
    { "time": "10:15", "total": 145, "human": 85, "bot": 60, "blocked": 12, "avgScore": 34 },
    { "time": "10:16", "total": 162, "human": 92, "bot": 70, "blocked": 18, "avgScore": 38 }
  ]
}
```

`GET /api/analytics/bot-vs-human`:
```json
{ "human": 2847, "bot": 1532, "period": "last_60_minutes" }
```

`GET /api/analytics/risk-distribution`:
```json
{ "distribution": [
  { "range": "0-20", "count": 1560 },
  { "range": "21-40", "count": 890 },
  { "range": "41-60", "count": 450 },
  { "range": "61-80", "count": 230 },
  { "range": "81-100", "count": 120 }
]}
```

`GET /api/analytics/mitigation-distribution`:
```json
{ "distribution": [
  { "name": "ALLOW", "value": 58 },
  { "name": "THROTTLE", "value": 18 },
  { "name": "DELAY", "value": 12 },
  { "name": "BLOCK", "value": 8 },
  { "name": "CHALLENGE", "value": 4 }
]}
```

**WebSocket stats broadcast (every 2s):**
```json
{
  "type": "ANALYTICS",
  "timestamp": "...",
  "payload": {
    "totalRequests": 15234,
    "botsDetected": 4532,
    "activeSessions": 127,
    "blockRate": 8.2,
    "requestsPerSecond": 42.5
  }
}
```

**Frontend:** All 4 charts receive real data. Remove hardcoded fallbacks.

### Phase 4: Honeypot Analytics

**Backend:**

| File | Action | Purpose |
|------|--------|---------|
| `honeypot/HoneypotAnalyticsService.java` | Create | Aggregate honeypot stats from Redis |
| `controller/HoneypotController.java` | Modify | Add `GET /api/honeypots/stats` |

**API:**
```json
{
  "traps": [
    { "name": "Hidden Field Trap", "type": "hidden_input", "hits": 42, "uniqueSessions": 18, "blocked": 12, "challenged": 5, "status": "active" },
    { "name": "Deceptive Link", "type": "fake_link", "hits": 28, "uniqueSessions": 14, "blocked": 8, "challenged": 3, "status": "active" }
  ],
  "topOffenders": [
    { "sessionId": "abc123", "hitCount": 15, "riskScore": 92, "blocked": true }
  ],
  "totalHits": 94,
  "totalUniqueSessions": 37,
  "conversionRate": 0.76
}
```

**Frontend:** Replace hardcoded cards, add animated bar for each trap showing blocked/challenged/hits breakdown.

### Phase 5: Geo-IP Enrichment

**Backend:**

| File | Action | Purpose |
|------|--------|---------|
| `geo/GeoIpService.java` | Create | MaxMind GeoLite2 reader + Redis cache |
| `geo/GeoLocation.java` | Create | DTO: country, city, asn, isp, lat, lon |
| `geo/GeoEnricher.java` | Create | Enriches events with geo context |
| `controller/AnalyticsController.java` | Modify | Add `GET /api/analytics/geo` |

**Geo-IP classpath resource:** `GeoLite2-City.mmdb` in `src/main/resources/geo/`

**API:**
```json
{
  "sources": [
    { "country": "United States", "code": "US", "flag": "🇺🇸", "count": 5234, "pct": 34.2, "botPct": 28.1 },
    { "country": "China", "code": "CN", "flag": "🇨🇳", "count": 2754, "pct": 18.0, "botPct": 65.3 }
  ],
  "asnBreakdown": [
    { "asn": 15169, "name": "Google Cloud", "count": 892, "botPct": 42.1 },
    { "asn": 16509, "name": "AWS", "count": 654, "botPct": 58.3 }
  ],
  "cloudProviders": [
    { "name": "AWS", "count": 654 },
    { "name": "Google Cloud", "count": 892 },
    { "name": "Azure", "count": 234 },
    { "name": "DigitalOcean", "count": 167 },
    { "name": "Hetzner", "count": 89 }
  ]
}
```

**Frontend:** Replace hardcoded Traffic Sources with live data, add ASN/cloud-provider breakdown.

### Phase 6: Adaptive Risk Scoring Engine

**Backend:**

| File | Action | Purpose |
|------|--------|---------|
| `scoring/WeightedSignal.java` | Create | Interface: `signalName, weight, threshold, enabled, compute()` |
| `scoring/RequestVelocitySignal.java` | Create | Weight 0.3 — RPM, interval variance |
| `scoring/HoneypotSignal.java` | Create | Weight 0.5 — honeypot hit count, frequency |
| `scoring/FingerprintSignal.java` | Create | Weight 0.4 — suspicious UA, missing headers, headless |
| `scoring/BehaviorEntropySignal.java` | Create | Weight 0.2 — navigation entropy, route diversity |
| `scoring/ReputationSignal.java` | Create | Weight 0.3 — IP/session/fingerprint reputation |
| `scoring/WeightedSignalRegistry.java` | Create | Loads weights/thresholds from Redis, dynamic reload |
| `scoring/RiskScoringEngine.java` | Create | Orchestrates all signals, computes score + confidence |
| `scoring/ScoreExplanation.java` | Create | DTO with signal contributions breakdown |
| `scoring/ConfidenceCalculator.java` | Create | Computes confidence from signal agreement |
| `controller/ScoringConfigController.java` | Create | GET/PUT `/api/config/scoring-weights` |
| `interceptor/RequestInterceptor.java` | Modify | Use RiskScoringEngine instead of HeuristicScoringService |

**Scoring formula:**
```
risk = Σ(signal_i.weight * signal_i.normalizedScore)
confidence = 1 - (variance of signal contributions / max variance)
```

**Score Explanation DTO:**
```json
{
  "finalScore": 81,
  "confidence": 0.85,
  "level": "LIKELY_BOT",
  "contributors": [
    { "signal": "honeypot", "weight": 0.5, "rawScore": 70, "normalizedScore": 0.7, "impact": 35.0 },
    { "signal": "requestVelocity", "weight": 0.3, "rawScore": 72, "normalizedScore": 0.72, "impact": 21.6 },
    { "signal": "fingerprint", "weight": 0.4, "rawScore": 55, "normalizedScore": 0.55, "impact": 22.0 },
    { "signal": "behaviorEntropy", "weight": 0.2, "rawScore": 30, "normalizedScore": 0.3, "impact": 6.0 },
    { "signal": "reputation", "weight": 0.3, "rawScore": 60, "normalizedScore": 0.6, "impact": 18.0 }
  ],
  "recommendation": "CHALLENGE",
  "recommendationReason": "High honeypot signal + elevated velocity"
}
```

**Dynamic config API:**
```
GET /api/config/scoring-weights → { signals: [{ name, weight, enabled, threshold }] }
PUT /api/config/scoring-weights → updates weights in Redis, signals reload dynamically
```

### Phase 7: Attack Replay System

**Backend:**

| File | Action | Purpose |
|------|--------|---------|
| `replay/ReplayRecorder.java` | Create | Listens to EventBus, writes to Redis Streams |
| `replay/ReplayService.java` | Create | Query replay data from Redis Streams |
| `replay/ReplaySession.java` | Create | DTO for full session replay |
| `replay/ReplayEvent.java` | Create | DTO for individual replayed request |
| `controller/ReplayController.java` | Create | `GET /api/replay/{sessionId}` |

**Redis Stream structure:**
```
XADD replay:stream:{sessionId} MAXLEN ~10000
  * type "DETECTION"
    timestamp "2026-05-22T10:45:00.000Z"
    method "GET"
    path "/api/companies/1/salary"
    riskScore 85
    mitigationAction "BLOCK"
    features "{\"rpm\":45,\"entropy\":2.1}"
    seq 1
```

**API:**
```json
GET /api/replay/{sessionId}
{
  "sessionId": "abc123",
  "ipAddress": "203.0.113.42",
  "country": "US",
  "totalRequests": 23,
  "duration": 45000,
  "avgScore": 67,
  "maxScore": 92,
  "finalAction": "BLOCK",
  "events": [
    {
      "seq": 1,
      "timestamp": "2026-05-22T10:45:00.000Z",
      "method": "GET",
      "path": "/api/companies",
      "riskScore": 12,
      "mitigationAction": "ALLOW",
      "features": { "rpm": 2, "entropy": 3.8 }
    },
    {
      "seq": 15,
      "timestamp": "2026-05-22T10:45:30.000Z",
      "method": "GET",
      "path": "/.env",
      "riskScore": 85,
      "mitigationAction": "BLOCK",
      "features": { "rpm": 45, "honeypotHits": 3 }
    }
  ],
  "scoreProgression": [
    { "seq": 1, "score": 12 },
    { "seq": 5, "score": 34 },
    { "seq": 10, "score": 56 },
    { "seq": 15, "score": 85 },
    { "seq": 23, "score": 92 }
  ],
  "mitigationTimeline": [
    { "seq": 8, "action": "THROTTLE" },
    { "seq": 12, "action": "CHALLENGE" },
    { "seq": 15, "action": "BLOCK" }
  ],
  "routeTraversal": [
    { "path": "/api/companies", "count": 3 },
    { "path": "/api/companies/1/salary", "count": 5 },
    { "path": "/.env", "count": 1 },
    { "path": "/wp-admin", "count": 2 }
  ]
}
```

**Frontend:** ReplayViewer component with:
- Timeline scrubber (horizontal slider)
- Score progression line chart
- Request cards with risk/mitigation badges
- Route traversal treemap

### Phase 8: Frontend SOC Dashboard

**Components to create/upgrade:**

| Component | Purpose |
|-----------|---------|
| `components/LiveThreatFeed.jsx` | Scrolling HIGH/CRITICAL event feed with pulse indicators |
| `components/MitigationTimeline.jsx` | Horizontal timeline of mitigation actions |
| `components/RiskGauge.jsx` | Animated gauge widget showing current risk level |
| `components/PulseIndicator.jsx` | Animated pulse dot for live status |
| `components/AttackOriginWidget.jsx` | Geo-map/bar showing attack origins |
| `components/SessionStream.jsx` | Live scrolling session activity |
| `components/StatCard.jsx` | Upgrade with Framer Motion animations |
| `App.jsx` | Add Framer Motion `AnimatePresence` page transitions |
| `index.css` | Add glassmorphism utilities, pulse animations |

**Framer Motion integration:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  whileHover={{ y: -2 }}
>
```

**Lucide Icons:** Replace all inline SVGs with `@geist-ui/icons` or `lucide-react` imports.

---

## 4. API Contract Summary

| Endpoint | Method | Phase | Purpose |
|----------|--------|-------|---------|
| `/api/analytics/stats` | GET | 3 | Current aggregated stats |
| `/api/analytics/timeseries` | GET | 3 | Time-series data for charts |
| `/api/analytics/bot-vs-human` | GET | 3 | Bot/human breakdown |
| `/api/analytics/risk-distribution` | GET | 3 | Risk score distribution |
| `/api/analytics/mitigation-distribution` | GET | 3 | Mitigation action distribution |
| `/api/analytics/geo` | GET | 5 | Geo-IP traffic sources |
| `/api/analytics/events` | GET | 2 | Recent events (fallback) |
| `/api/analytics/sessions` | GET | — | Active sessions |
| `/api/honeypots/stats` | GET | 4 | Honeypot analytics |
| `/api/replay/{sessionId}` | GET | 7 | Session replay |
| `/api/config/scoring-weights` | GET/PUT | 6 | Dynamic scoring config |
| `/api/simulator/start\|stop\|status` | POST/GET | — | Traffic simulators |
| `/ws-stomp` | WS | 2 | STOMP WebSocket endpoint |

---

## 5. Frontend Architecture

### Component Hierarchy
```
App
├── Navbar (sidebar, lucide icons, connection indicator)
├── main (AnimatePresence)
│   ├── Dashboard
│   │   ├── StatCard × 4 (Framer Motion animated)
│   │   ├── LiveThreatFeed (scrolling HIGH/CRITICAL events)
│   │   ├── RequestsOverTime (real data via API + WS)
│   │   ├── BotVsHumanChart (real data)
│   │   │   └── RiskGauge
│   │   ├── MitigationChart (real data)
│   │   └── RiskHistogram (real data)
│   ├── ThreatFeed → Event cards, filter bar, pulse indicators
│   ├── SessionInspector → Session list + detail panel
│   ├── Analytics
│   │   ├── RequestsOverTime
│   │   ├── BotVsHumanChart
│   │   ├── RiskHistogram
│   │   └── AttackOriginWidget
│   ├── HoneypotMonitor → Real trap cards, conversion rate, top offenders
│   └── MitigationView
│       ├── MitigationChart
│       ├── MitigationRules
│       ├── MitigationTimeline
│       └── MitigationLog
```

### WebSocket Data Flow
```
Backend event occurs
  → DetectionEvent published via ApplicationEventPublisher
  → WebSocketEventListener receives event
  → Publishes envelope to /topic/events
  → Frontend useStomp hook receives
  → Context reducer updates state
  → Relevant components re-render
```

---

## 6. Testing Strategy

### Backend
- Unit tests per signal implementation (mock FeatureSnapshot, verify score)
- Integration tests with TestRedisConfiguration (embedded Redis)
- End-to-end: start simulators, verify events appear in Redis streams
- Load test: 1000 concurrent bot sessions, verify Redis IOPS < 5000/s

### Frontend
- Component tests with Vitest + React Testing Library
- WebSocket mock for hook testing
- Visual regression for charts (hardcoded baseline snapshots)

---

## 7. File Manifest (New + Modified)

### New Backend Files (30+)
```
model/EnvelopeEvent.java
model/EventType.java
model/SeverityLevel.java
model/ScoreExplanation.java
model/GeoLocation.java
model/ReplaySession.java
model/ReplayEvent.java
event/EventBusService.java
event/DetectionEvent.java
listener/MitigationEventListener.java
listener/AnalyticsEventListener.java
listener/ReplayEventListener.java
listener/WebSocketEventListener.java
websocket/StompController.java
websocket/WebSocketConfig.java (rewrite)
mitigation/MitigationEngine.java (rewrite)
analytics/AnalyticsAggregatorService.java
analytics/TimeSeriesService.java
analytics/RealtimeStatsService.java
honeypot/HoneypotAnalyticsService.java
geo/GeoIpService.java
geo/GeoEnricher.java
scoring/WeightedSignal.java
scoring/RequestVelocitySignal.java
scoring/HoneypotSignal.java
scoring/FingerprintSignal.java
scoring/BehaviorEntropySignal.java
scoring/ReputationSignal.java
scoring/WeightedSignalRegistry.java
scoring/RiskScoringEngine.java
scoring/ConfidenceCalculator.java
replay/ReplayRecorder.java
replay/ReplayService.java
controller/AnalyticsController.java (refactor)
controller/ScoringConfigController.java
controller/ReplayController.java
```

### New Frontend Files (10+)
```
hooks/useStomp.js
components/LiveThreatFeed.jsx
components/MitigationTimeline.jsx
components/RiskGauge.jsx
components/PulseIndicator.jsx
components/AttackOriginWidget.jsx
components/SessionStream.jsx
pages/ReplayViewer.jsx (or route)
```

### Modified Frontend Files (15+)
```
hooks/useWebSocket.js → wrap useStomp
pages/Dashboard.jsx → real data, live feed
pages/ThreatFeed.jsx → real WS events
pages/Analytics.jsx → real geo data
pages/HoneypotMonitor.jsx → real stats
pages/MitigationView.jsx → real data + timeline
charts/*.jsx → accept real data props (no fallbacks)
App.jsx → Framer Motion
Navbar.jsx → Lucide icons
StatCard.jsx → Framer Motion animations
index.css → glassmorphism utilities
package.json → add deps
```

---

## 8. Build Order & Dependencies

```
Phase 1 (Redis Mitigation + Event Bus)
  └── no dependencies
Phase 2 (WebSocket)
  └── depends on Phase 1 (Event Bus publishes to WS)
Phase 3 (Time-Series)
  └── depends on Phase 1 (Event Bus → Analytics counters)
Phase 4 (Honeypot Analytics)
  └── depends on Phase 3 (uses same aggregation pattern)
Phase 5 (Geo-IP)
  └── depends on Phase 3 (geo enriches analytics)
Phase 6 (Adaptive Scoring)
  └── depends on Phase 1 (Event Bus → signals use Redis state)
Phase 7 (Replay)
  └── depends on Phase 1 (Event Bus → Redis Streams)
Phase 8 (Frontend Polish)
  └── depends on Phase 2-7 (uses all real data)
```
