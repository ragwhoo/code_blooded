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

    public EnvelopeEvent() {
        this.timestamp = Instant.now();
    }

    public EnvelopeEvent(EventType type, String sessionId, SeverityLevel severity, Map<String, Object> payload) {
        this.type = type;
        this.sessionId = sessionId;
        this.severity = severity;
        this.payload = payload;
        this.timestamp = Instant.now();
    }

    public EventType getType() { return type; }
    public void setType(EventType type) { this.type = type; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public SeverityLevel getSeverity() { return severity; }
    public void setSeverity(SeverityLevel severity) { this.severity = severity; }
    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
