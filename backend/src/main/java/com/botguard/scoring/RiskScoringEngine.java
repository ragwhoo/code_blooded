package com.botguard.scoring;

import com.botguard.model.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RiskScoringEngine {
    private final WeightedSignalRegistry registry;
    private final ConfidenceCalculator confidenceCalculator;

    public RiskScoringEngine(WeightedSignalRegistry registry, ConfidenceCalculator confidenceCalculator) {
        this.registry = registry;
        this.confidenceCalculator = confidenceCalculator;
    }

    public BotScore evaluate(FeatureSnapshot features, SessionInfo session) {
        List<WeightedSignal> enabledSignals = registry.getEnabled();
        List<ScoreExplanation> contributions = new ArrayList<>();
        double totalWeight = 0;
        double weightedSum = 0;

        for (WeightedSignal signal : enabledSignals) {
            double rawScore = signal.computeScore(features, session);
            double effectiveWeight = registry.getEffectiveWeight(signal.getName());
            double normalizedScore = Math.min(100, Math.max(0, rawScore)) / 100.0;
            double impact = normalizedScore * effectiveWeight * 100;

            contributions.add(new ScoreExplanation(
                    signal.getName(),
                    effectiveWeight,
                    Math.min(100, Math.max(0, rawScore)),
                    normalizedScore,
                    Math.min(100, Math.max(0, impact))
            ));
            totalWeight += effectiveWeight;
            weightedSum += normalizedScore * effectiveWeight;
        }

        double finalScore = totalWeight > 0
                ? Math.min(100, Math.max(0, (weightedSum / totalWeight) * 100))
                : 0;
        int scoreInt = (int) Math.round(finalScore);
        RiskLevel level = RiskLevel.fromScore(scoreInt);

        Map<String, Integer> breakdown = new HashMap<>();
        for (ScoreExplanation c : contributions) {
            breakdown.put(c.getSignalName(), (int) Math.round(c.getImpact()));
        }

        return new BotScore(
                session.getSessionId(),
                scoreInt,
                level,
                breakdown,
                Instant.now()
        );
    }
}
