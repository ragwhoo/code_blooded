package com.botguard.model;

import java.time.Instant;
import java.util.Map;

public record BotScore(
        String sessionId,
        int score,
        RiskLevel riskLevel,
        Map<String, Integer> breakdown,
        Instant timestamp
) {}
