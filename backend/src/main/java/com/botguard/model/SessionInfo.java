package com.botguard.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class SessionInfo {
    private String sessionId;
    private String ip;
    private String fingerprint;
    private String userAgent;
    private Instant startTime;
    private Instant lastSeen;
    private int requestCount;
    private List<String> paths = new ArrayList<>();
    private List<Long> timestamps = new ArrayList<>();
    private int honeypotHits;
    private int score;
    private RiskLevel riskLevel = RiskLevel.NORMAL;
    private MitigationAction mitigationAction = MitigationAction.ALLOW;

    public SessionInfo() {}

    public SessionInfo(String sessionId, String ip) {
        this.sessionId = sessionId;
        this.ip = ip;
        this.startTime = Instant.now();
        this.lastSeen = Instant.now();
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public String getFingerprint() { return fingerprint; }
    public void setFingerprint(String fingerprint) { this.fingerprint = fingerprint; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }
    public int getRequestCount() { return requestCount; }
    public void setRequestCount(int requestCount) { this.requestCount = requestCount; }
    public List<String> getPaths() { return paths; }
    public void setPaths(List<String> paths) { this.paths = paths; }
    public List<Long> getTimestamps() { return timestamps; }
    public void setTimestamps(List<Long> timestamps) { this.timestamps = timestamps; }
    public int getHoneypotHits() { return honeypotHits; }
    public void setHoneypotHits(int honeypotHits) { this.honeypotHits = honeypotHits; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }
    public MitigationAction getMitigationAction() { return mitigationAction; }
    public void setMitigationAction(MitigationAction mitigationAction) { this.mitigationAction = mitigationAction; }
}
