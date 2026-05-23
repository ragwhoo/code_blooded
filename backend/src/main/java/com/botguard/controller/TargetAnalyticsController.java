package com.botguard.controller;

import com.botguard.analytics.AnalyticsService;
import com.botguard.model.AnalyticsEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/target")
public class TargetAnalyticsController {

    @Autowired private AnalyticsService analyticsService;

    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getScraperReport() {
        List<AnalyticsEvent> allEvents = analyticsService.getRecentEvents(200);

        List<Map<String, Object>> hits = allEvents.stream()
            .filter(e -> e.getDetails() != null)
            .filter(e -> {
                String path = (String) e.getDetails().get("path");
                return path != null && (path.startsWith("/target/") || path.startsWith("/api/target/"));
            })
            .map(e -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("timestamp", e.getTimestamp() != null ? e.getTimestamp().toString() : null);
                m.put("ip", e.getIp());
                m.put("path", e.getDetails().get("path"));
                m.put("userAgent", e.getDetails().get("userAgent"));
                m.put("riskScore", e.getScore());
                m.put("mitigationAction", e.getDetails().get("mitigationAction"));
                m.put("trapType", e.getDetails().get("trapType"));
                return m;
            })
            .collect(Collectors.toList());

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalRequests", analyticsService.getTotalRequests());
        report.put("blockedRequests", analyticsService.getBlockedRequests());
        report.put("botDetections", analyticsService.getBotDetections());
        report.put("honeypotHits", hits.stream().filter(h -> h.get("trapType") != null).count());
        report.put("hits", hits);

        return ResponseEntity.ok(report);
    }

    @GetMapping("/report/stats")
    public ResponseEntity<Map<String, Object>> getScraperStats() {
        var stats = analyticsService.getStats();
        stats.put("blockRate", analyticsService.getTotalRequests() > 0
            ? String.format("%.1f", (double) analyticsService.getBlockedRequests() / analyticsService.getTotalRequests() * 100)
            : "0.0");
        stats.put("honeypotHits", 0L);
        return ResponseEntity.ok(stats);
    }
}
