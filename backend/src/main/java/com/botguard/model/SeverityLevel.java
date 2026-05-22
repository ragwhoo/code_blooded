package com.botguard.model;

public enum SeverityLevel {
    LOW(0),
    MEDIUM(1),
    HIGH(2),
    CRITICAL(3);

    private final int priority;

    SeverityLevel(int priority) {
        this.priority = priority;
    }

    public int getPriority() { return priority; }

    public static SeverityLevel fromScore(double score) {
        if (score >= 80) return CRITICAL;
        if (score >= 60) return HIGH;
        if (score >= 30) return MEDIUM;
        return LOW;
    }
}
