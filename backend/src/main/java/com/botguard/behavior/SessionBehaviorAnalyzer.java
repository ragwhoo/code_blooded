package com.botguard.behavior;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SessionBehaviorAnalyzer {

    private static final Logger log = LoggerFactory.getLogger(SessionBehaviorAnalyzer.class);

    public double computeHumanLikenessScore(SessionInfo sessionInfo, FeatureSnapshot snapshot) {
        double score = 0;
        double weights = 0;

        double timingScore = evaluateTimingRegularity(sessionInfo, snapshot);
        score += timingScore * 0.3;
        weights += 0.3;

        double routeScore = evaluateRouteDiversity(sessionInfo);
        score += routeScore * 0.25;
        weights += 0.25;

        double depthScore = evaluateSessionDepth(sessionInfo);
        score += depthScore * 0.15;
        weights += 0.15;

        double navScore = evaluateNavigationFlow(sessionInfo, snapshot);
        score += navScore * 0.3;
        weights += 0.3;

        double finalScore = weights > 0 ? score / weights : 0;
        log.debug("Human-likeness score for session {}: {}", sessionInfo.getSessionId(), String.format("%.2f", finalScore));
        return finalScore;
    }

    private double evaluateTimingRegularity(SessionInfo sessionInfo, FeatureSnapshot snapshot) {
        double variance = snapshot.getIntervalVariance();
        if (variance <= 0) return 0;
        if (variance < 100) return 0.1;
        if (variance < 500) return 0.3;
        if (variance < 2000) return 0.6;
        if (variance < 5000) return 0.8;
        return 1.0;
    }

    private double evaluateRouteDiversity(SessionInfo sessionInfo) {
        Set<String> uniquePaths = new HashSet<>(sessionInfo.getPaths());
        int totalRequests = sessionInfo.getRequestCount();
        if (totalRequests == 0) return 0;
        double diversityRatio = (double) uniquePaths.size() / totalRequests;
        if (diversityRatio > 0.7) return 1.0;
        if (diversityRatio > 0.5) return 0.7;
        if (diversityRatio > 0.3) return 0.4;
        if (diversityRatio > 0.15) return 0.2;
        return 0.05;
    }

    private double evaluateSessionDepth(SessionInfo sessionInfo) {
        List<String> paths = sessionInfo.getPaths();
        if (paths.isEmpty()) return 0;
        int maxDepth = paths.stream().mapToInt(p -> p.split("/").length).max().orElse(0);
        if (maxDepth >= 4) return 1.0;
        if (maxDepth >= 3) return 0.7;
        if (maxDepth >= 2) return 0.4;
        return 0.2;
    }

    private double evaluateNavigationFlow(SessionInfo sessionInfo, FeatureSnapshot snapshot) {
        List<String> paths = sessionInfo.getPaths();
        if (paths.size() < 3) return 0.5;

        int directionChanges = 0;
        for (int i = 2; i < paths.size(); i++) {
            String prevPrev = paths.get(i - 2);
            String prev = paths.get(i - 1);
            String curr = paths.get(i);

            if (!prevPrev.equals(curr) && !prevPrev.equals(prev) && !prev.equals(curr)) {
                if (isNavigationalJump(prevPrev, prev, curr)) {
                    directionChanges++;
                }
            }
        }

        double changeRatio = (double) directionChanges / Math.max(1, paths.size() - 2);
        if (changeRatio > 0.3) return 0.9;
        if (changeRatio > 0.15) return 0.6;
        if (changeRatio > 0.05) return 0.3;
        return 0.1;
    }

    private boolean isNavigationalJump(String a, String b, String c) {
        String baseA = a.replaceAll("/\\d+$", "");
        String baseB = b.replaceAll("/\\d+$", "");
        String baseC = c.replaceAll("/\\d+$", "");
        return !baseA.equals(baseB) && !baseB.equals(baseC);
    }
}
