package com.botguard.model;

public enum RiskLevel {
    NORMAL(0, 29),
    SUSPICIOUS(30, 59),
    LIKELY_BOT(60, 89),
    CONFIRMED_BOT(90, Integer.MAX_VALUE);

    private final int minScore;
    private final int maxScore;

    RiskLevel(int minScore, int maxScore) {
        this.minScore = minScore;
        this.maxScore = maxScore;
    }

    public int getMinScore() { return minScore; }
    public int getMaxScore() { return maxScore; }

    public static RiskLevel fromScore(int score) {
        for (RiskLevel level : values()) {
            if (score >= level.minScore && score <= level.maxScore) {
                return level;
            }
        }
        return CONFIRMED_BOT;
    }
}
