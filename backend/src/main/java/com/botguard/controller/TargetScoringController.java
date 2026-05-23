package com.botguard.controller;

import com.botguard.behavior.SessionBehaviorAnalyzer;
import com.botguard.event.EventBusService;
import com.botguard.features.BrowserFingerprintService;
import com.botguard.features.FeatureExtractionService;
import com.botguard.features.Ja3FingerprintService;
import com.botguard.heuristics.HeuristicScoringService;
import com.botguard.mitigation.MitigationEngine;
import com.botguard.model.*;
import com.botguard.scoring.RiskScoringEngine;
import com.botguard.service.SphinxToggleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
@RequestMapping("/api/target")
public class TargetScoringController {

    @Autowired private FeatureExtractionService featureExtractionService;
    @Autowired private HeuristicScoringService heuristicScoringService;
    @Autowired private RiskScoringEngine riskScoringEngine;
    @Autowired private SessionBehaviorAnalyzer sessionBehaviorAnalyzer;
    @Autowired private MitigationEngine mitigationEngine;
    @Autowired private EventBusService eventBusService;
    @Autowired private Ja3FingerprintService ja3FingerprintService;
    @Autowired private BrowserFingerprintService browserFingerprintService;
    @Autowired private SphinxToggleService sphinxToggle;

    @PostMapping("/score")
    public ResponseEntity<?> scoreRequest(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        if (!sphinxToggle.isEnabled()) {
            return ResponseEntity.ok(Map.of("sessionId", "disabled", "score", 0, "riskLevel", "LOW", "action", "ALLOW"));
        }

        String path = (String) body.getOrDefault("path", "/");
        String ip = (String) body.getOrDefault("ip", request.getRemoteAddr());
        String userAgent = (String) body.getOrDefault("userAgent", "Unknown");

        String sessionId = "target-" + ip.replaceAll("[.:]", "_");

        Ja3FingerprintService.Ja3Result ja3 = ja3FingerprintService.analyze(userAgent);

        featureExtractionService.asyncProcess(sessionId, path);
        FeatureSnapshot snapshot = featureExtractionService.extractFeatures(sessionId);

        SessionInfo sessionInfo = new SessionInfo(sessionId, ip);
        sessionInfo.getPaths().add(path);
        sessionInfo.getTimestamps().add(System.currentTimeMillis());
        sessionInfo.setRequestCount(snapshot.getRpm());
        sessionInfo.setUserAgent(userAgent);

        BotScore heuristicScore = heuristicScoringService.score(snapshot, sessionInfo);

        BotScore signalScore = riskScoringEngine.evaluate(snapshot, sessionInfo);

        double humanLikeness = sessionBehaviorAnalyzer.computeHumanLikenessScore(sessionInfo, snapshot);
        int behaviorBotScore = (int) Math.round((1.0 - humanLikeness) * 40);

        boolean hasFingerprint = browserFingerprintService.hasValidFingerprint(sessionId);
        int fpPenalty = hasFingerprint ? 0 : 15;

        int combined = (int) Math.round(
            heuristicScore.score() * 0.35 +
            signalScore.score() * 0.35 +
            behaviorBotScore * 0.20 +
            fpPenalty * 0.10
        );
        double effectiveScore = Math.min(combined + ja3.suspicionScore(), 100);
        RiskLevel riskLevel = RiskLevel.fromScore((int) effectiveScore);
        MitigationAction action = mitigationEngine.evaluate(effectiveScore, sessionId, ip, null);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("riskScore", (int) effectiveScore);
        payload.put("level", riskLevel.name());
        payload.put("mitigationAction", action.name());
        payload.put("ipAddress", ip);
        payload.put("userAgent", userAgent);
        payload.put("path", path);
        payload.put("method", "GET");
        payload.put("ja3Client", ja3.clientName());
        payload.put("sessionId", sessionId);
        payload.put("heuristicScore", heuristicScore.score());
        payload.put("signalScore", signalScore.score());
        payload.put("behaviorScore", behaviorBotScore);
        payload.put("humanLikeness", String.format("%.2f", humanLikeness));
        payload.put("hasBrowserFingerprint", hasFingerprint);
        if (!hasFingerprint) {
            payload.put("noBrowserFingerprint", true);
        }

        SeverityLevel severity = SeverityLevel.fromScore((int) effectiveScore);
        EnvelopeEvent envelope = new EnvelopeEvent(EventType.DETECTION, sessionId, severity, payload);
        eventBusService.publish(envelope);

        return ResponseEntity.ok(Map.of(
            "sessionId", sessionId,
            "score", (int) effectiveScore,
            "riskLevel", riskLevel.name(),
            "action", action.name()
        ));
    }
}
