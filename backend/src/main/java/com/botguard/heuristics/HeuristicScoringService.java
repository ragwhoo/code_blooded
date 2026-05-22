package com.botguard.heuristics;

import com.botguard.model.BotScore;
import com.botguard.model.FeatureSnapshot;
import com.botguard.model.RiskLevel;
import com.botguard.model.SessionInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class HeuristicScoringService {

    private static final Logger log = LoggerFactory.getLogger(HeuristicScoringService.class);

    @Autowired
    private HeuristicConfig heuristicConfig;

    public BotScore score(FeatureSnapshot snapshot, SessionInfo sessionInfo) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        int totalScore = 0;

        for (HeuristicRule rule : heuristicConfig.getRules()) {
            if (!rule.isEnabled()) continue;
            int ruleScore = evaluateRule(rule, snapshot, sessionInfo);
            if (ruleScore > 0) {
                breakdown.put(rule.getName(), ruleScore);
                totalScore += ruleScore;
            }
        }

        totalScore = Math.min(100, totalScore);
        RiskLevel riskLevel = RiskLevel.fromScore(totalScore);

        log.debug("BotScore for session {}: score={}, riskLevel={}, breakdown={}",
                sessionInfo.getSessionId(), totalScore, riskLevel, breakdown);

        return new BotScore(
                sessionInfo.getSessionId(),
                totalScore,
                riskLevel,
                breakdown,
                Instant.now()
        );
    }

    private int evaluateRule(HeuristicRule rule, FeatureSnapshot snapshot, SessionInfo sessionInfo) {
        String condition = rule.getCondition();
        try {
            boolean triggered = evaluateCondition(condition, snapshot);
            return triggered ? rule.getWeight() : 0;
        } catch (Exception e) {
            log.warn("Failed to evaluate rule '{}': {}", rule.getName(), e.getMessage());
            return 0;
        }
    }

    boolean evaluateCondition(String condition, FeatureSnapshot snapshot) {
        String expr = condition.trim();

        if (expr.contains(">")) {
            String[] parts = expr.split(">");
            return compareGreater(parts[0].trim(), parts[1].trim(), snapshot);
        } else if (expr.contains("<")) {
            String[] parts = expr.split("<");
            return compareLesser(parts[0].trim(), parts[1].trim(), snapshot);
        } else if (expr.contains(">=")) {
            String[] parts = expr.split(">=");
            return compareGreaterOrEqual(parts[0].trim(), parts[1].trim(), snapshot);
        } else if (expr.contains("<=")) {
            String[] parts = expr.split("<=");
            return compareLesserOrEqual(parts[0].trim(), parts[1].trim(), snapshot);
        } else if (expr.contains("==")) {
            String[] parts = expr.split("==");
            return compareEqual(parts[0].trim(), parts[1].trim(), snapshot);
        }

        return false;
    }

    private double getNumericValue(String field, FeatureSnapshot snapshot) {
        return switch (field) {
            case "rpm" -> snapshot.getRpm();
            case "avgInterval" -> snapshot.getAvgInterval();
            case "intervalVariance" -> snapshot.getIntervalVariance();
            case "sequentialRatio" -> snapshot.getSequentialRatio();
            case "navigationEntropy" -> snapshot.getNavigationEntropy();
            case "salaryPageRatio" -> snapshot.getSalaryPageRatio();
            case "assetRatio" -> snapshot.getAssetRatio();
            case "honeypotCount" -> snapshot.getHoneypotCount();
            case "repeatedPatternScore" -> snapshot.getRepeatedPatternScore();
            default -> throw new IllegalArgumentException("Unknown field: " + field);
        };
    }

    private boolean compareGreater(String field, String valueStr, FeatureSnapshot snapshot) {
        return getNumericValue(field, snapshot) > Double.parseDouble(valueStr);
    }

    private boolean compareLesser(String field, String valueStr, FeatureSnapshot snapshot) {
        return getNumericValue(field, snapshot) < Double.parseDouble(valueStr);
    }

    private boolean compareGreaterOrEqual(String field, String valueStr, FeatureSnapshot snapshot) {
        return getNumericValue(field, snapshot) >= Double.parseDouble(valueStr);
    }

    private boolean compareLesserOrEqual(String field, String valueStr, FeatureSnapshot snapshot) {
        return getNumericValue(field, snapshot) <= Double.parseDouble(valueStr);
    }

    private boolean compareEqual(String field, String valueStr, FeatureSnapshot snapshot) {
        return getNumericValue(field, snapshot) == Double.parseDouble(valueStr);
    }

}
