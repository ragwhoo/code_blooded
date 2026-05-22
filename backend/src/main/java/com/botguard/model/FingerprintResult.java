package com.botguard.model;

import java.util.List;

public class FingerprintResult {
    private boolean suspicious;
    private List<String> anomalies;
    private double confidenceScore;

    public FingerprintResult() {}

    public FingerprintResult(boolean suspicious, List<String> anomalies, double confidenceScore) {
        this.suspicious = suspicious;
        this.anomalies = anomalies;
        this.confidenceScore = confidenceScore;
    }

    public boolean isSuspicious() { return suspicious; }
    public void setSuspicious(boolean suspicious) { this.suspicious = suspicious; }
    public List<String> getAnomalies() { return anomalies; }
    public void setAnomalies(List<String> anomalies) { this.anomalies = anomalies; }
    public double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }
}
