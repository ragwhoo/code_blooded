package com.botguard.controller;

import com.botguard.analytics.AnalyticsService;
import com.botguard.event.EventBusService;
import com.botguard.model.*;
import com.botguard.service.HoneytrapInjector;
import com.botguard.service.SphinxToggleService;
import com.botguard.heuristics.HeuristicScoringService;
import com.botguard.mitigation.MitigationEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/target")
public class TargetRenderController {

    private static final Path TARGET_ROOT = Paths.get("C:/Users/raghu/Desktop/botguard/target_11");

    @Autowired private HoneytrapInjector honeytrapInjector;
    @Autowired private EventBusService eventBusService;
    @Autowired private HeuristicScoringService heuristicScoringService;
    @Autowired private MitigationEngine mitigationEngine;
    @Autowired private AnalyticsService analyticsService;
    @Autowired private SphinxToggleService sphinxToggle;

    @GetMapping("/render")
    public ResponseEntity<?> renderPage(
            @RequestParam(defaultValue = "/index.html") String path,
            HttpServletRequest request) {

        String safePath = path.replace("..", "").replaceAll("[<>\"|?*]", "");
        if (!safePath.startsWith("/")) safePath = "/" + safePath;
        if (safePath.endsWith("/")) safePath = safePath + "index.html";

        Path filePath = TARGET_ROOT.resolve("." + safePath).normalize();
        if (!filePath.startsWith(TARGET_ROOT)) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.status(404).body("Not found");
        }

        try {
            String content = Files.readString(filePath);
            boolean enabled = sphinxToggle.isEnabled();

            if (enabled) {
                String ip = request.getRemoteAddr();
                String ua = request.getHeader("User-Agent");
                String sessionId = "scraper-" + UUID.randomUUID().toString().substring(0, 8);

                HoneytrapInjector.InjectedResult result = honeytrapInjector.inject(content, safePath);

                Map<String, Object> payload = new HashMap<>();
                payload.put("path", safePath);
                payload.put("ipAddress", ip);
                payload.put("userAgent", ua);
                payload.put("method", "GET");
                payload.put("riskScore", 25);
                payload.put("riskLevel", "LOW");
                payload.put("mitigationAction", "MONITOR");
                payload.put("honeytrapsInjected", result.trapPaths().size());
                payload.put("sessionId", sessionId);

                EnvelopeEvent envelope = new EnvelopeEvent(EventType.DETECTION, sessionId, SeverityLevel.LOW, payload);
                eventBusService.publish(envelope);

                return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .header("X-Sphinx", "enabled")
                    .body(result.html());
            }

            return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .header("X-Sphinx", "disabled")
                .body(content);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error reading file");
        }
    }

    @GetMapping("/honeypot/{trapType}")
    public ResponseEntity<?> honeypotTriggered(
            @PathVariable String trapType,
            @RequestParam(required = false) String tid,
            HttpServletRequest request) {

        String ip = request.getRemoteAddr();
        String ua = request.getHeader("User-Agent");

        Map<String, Object> payload = new HashMap<>();
        payload.put("path", "/api/target/honeypot/" + trapType + "?tid=" + tid);
        payload.put("ipAddress", ip);
        payload.put("userAgent", ua);
        payload.put("method", "GET");
        payload.put("riskScore", 100);
        payload.put("riskLevel", "CRITICAL");
        payload.put("mitigationAction", "TEMP_BLOCK");
        payload.put("trapType", trapType);
        payload.put("sessionId", "trap-" + (tid != null ? tid : "unknown"));

        analyticsService.incrementBotDetections();
        analyticsService.incrementBlockedCount();

        EnvelopeEvent envelope = new EnvelopeEvent(EventType.HONEYPOT, "trap-" + (tid != null ? tid : "unknown"), SeverityLevel.CRITICAL, payload);
        eventBusService.publish(envelope);

        mitigationEngine.evaluate(100, "trap-" + (tid != null ? tid : "unknown"), ip, null);

        return ResponseEntity.status(403)
            .header("X-BotGuard-Score", "100")
            .header("X-BotGuard-Level", "CRITICAL")
            .body("<html><body><h1>403 Blocked</h1><p>Automated request detected.</p></body></html>");
    }
}
