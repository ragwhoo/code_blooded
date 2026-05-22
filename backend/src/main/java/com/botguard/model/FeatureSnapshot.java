package com.botguard.model;

public class FeatureSnapshot {
    private int rpm;
    private double avgInterval;
    private double intervalVariance;
    private double sequentialRatio;
    private double navigationEntropy;
    private double salaryPageRatio;
    private double assetRatio;
    private int honeypotCount;
    private double repeatedPatternScore;

    public int getRpm() { return rpm; }
    public void setRpm(int rpm) { this.rpm = rpm; }
    public double getAvgInterval() { return avgInterval; }
    public void setAvgInterval(double avgInterval) { this.avgInterval = avgInterval; }
    public double getIntervalVariance() { return intervalVariance; }
    public void setIntervalVariance(double intervalVariance) { this.intervalVariance = intervalVariance; }
    public double getSequentialRatio() { return sequentialRatio; }
    public void setSequentialRatio(double sequentialRatio) { this.sequentialRatio = sequentialRatio; }
    public double getNavigationEntropy() { return navigationEntropy; }
    public void setNavigationEntropy(double navigationEntropy) { this.navigationEntropy = navigationEntropy; }
    public double getSalaryPageRatio() { return salaryPageRatio; }
    public void setSalaryPageRatio(double salaryPageRatio) { this.salaryPageRatio = salaryPageRatio; }
    public double getAssetRatio() { return assetRatio; }
    public void setAssetRatio(double assetRatio) { this.assetRatio = assetRatio; }
    public int getHoneypotCount() { return honeypotCount; }
    public void setHoneypotCount(int honeypotCount) { this.honeypotCount = honeypotCount; }
    public double getRepeatedPatternScore() { return repeatedPatternScore; }
    public void setRepeatedPatternScore(double repeatedPatternScore) { this.repeatedPatternScore = repeatedPatternScore; }
}
