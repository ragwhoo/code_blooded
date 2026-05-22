package com.botguard.model;

import java.time.Instant;
import java.util.Map;

public class AnalyticsEvent {
    private EventType type;
    private String sessionId;
    private String ip;
    private int score;
    private Map<String, Object> details;
    private Instant timestamp;

    public enum EventType {
        DETECTION, MITIGATION, BLOCK, HONEYPOT_HIT, REPUTATION_CHANGE
    }

    public AnalyticsEvent() {}

    public AnalyticsEvent(EventType type, String sessionId, String ip, int score, Map<String, Object> details) {
        this.type = type;
        this.sessionId = sessionId;
        this.ip = ip;
        this.score = score;
        this.details = details;
        this.timestamp = Instant.now();
    }

    public EventType getType() { return type; }
    public void setType(EventType type) { this.type = type; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
