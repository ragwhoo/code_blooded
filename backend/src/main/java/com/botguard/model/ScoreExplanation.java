package com.botguard.model;

public class ScoreExplanation {
    private String signalName;
    private double weight;
    private double rawScore;
    private double normalizedScore;
    private double impact;

    public ScoreExplanation() {}

    public ScoreExplanation(String signalName, double weight, double rawScore, double normalizedScore, double impact) {
        this.signalName = signalName;
        this.weight = weight;
        this.rawScore = rawScore;
        this.normalizedScore = normalizedScore;
        this.impact = impact;
    }

    public String getSignalName() { return signalName; }
    public void setSignalName(String signalName) { this.signalName = signalName; }
    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }
    public double getRawScore() { return rawScore; }
    public void setRawScore(double rawScore) { this.rawScore = rawScore; }
    public double getNormalizedScore() { return normalizedScore; }
    public void setNormalizedScore(double normalizedScore) { this.normalizedScore = normalizedScore; }
    public double getImpact() { return impact; }
    public void setImpact(double impact) { this.impact = impact; }
}
