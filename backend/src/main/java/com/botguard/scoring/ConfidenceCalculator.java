package com.botguard.scoring;

import com.botguard.model.ScoreExplanation;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ConfidenceCalculator {
    public double calculate(List<ScoreExplanation> contributions) {
        if (contributions == null || contributions.isEmpty()) return 0;
        double mean = contributions.stream().mapToDouble(ScoreExplanation::getNormalizedScore).average().orElse(0);
        double variance = contributions.stream()
                .mapToDouble(c -> Math.pow(c.getNormalizedScore() - mean, 2))
                .average().orElse(0);
        double maxVariance = 0.25;
        return Math.min(1.0, Math.max(0, 1.0 - (variance / maxVariance)));
    }
}
