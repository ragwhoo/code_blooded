package com.botguard.controller;

import com.botguard.analytics.AnalyticsService;
import com.botguard.model.AnalyticsEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/honeytraps")
public class HoneytrapStatusController {

    @Autowired private AnalyticsService analyticsService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        List<AnalyticsEvent> events = analyticsService.getRecentEvents(500);

        List<Map<String, Object>> triggers = events.stream()
            .filter(e -> e.getDetails() != null)
            .filter(e -> "HONEYPOT".equals(e.getType().name()) || e.getDetails().get("trapType") != null)
            .map(e -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("timestamp", e.getTimestamp() != null ? e.getTimestamp().toString() : null);
                m.put("ip", e.getIp());
                m.put("trapType", e.getDetails().get("trapType"));
                m.put("path", e.getDetails().get("path"));
                m.put("score", e.getScore());
                return m;
            })
            .collect(Collectors.toList());

        Map<String, Long> trapHits = triggers.stream()
            .filter(t -> t.get("trapType") != null)
            .collect(Collectors.groupingBy(t -> (String) t.get("trapType"), Collectors.counting()));

        // Map actual trapType values from events to display categories
        List<String> adminLinkTypes = List.of("admin-config", "wp-admin", "backup.sql", ".env", "api-docs", "salary-data-export");
        long adminHits = adminLinkTypes.stream().mapToLong(t -> trapHits.getOrDefault(t, 0L)).sum();
        long cssHits = trapHits.getOrDefault("internal-link", 0L);
        long commentHits = trapHits.getOrDefault("debug-endpoint", 0L);
        long jsHits = trapHits.getOrDefault("js-trigger", 0L);

        Map<String, Object> traps = new LinkedHashMap<>();
        traps.put("hidden_admin_links", Map.of(
            "label", "Hidden Admin Links",
            "description", "3 invisible anchor tags pointing to fake admin URLs (admin-config, wp-admin, .env, etc.)",
            "status", "active",
            "hits", adminHits
        ));
        traps.put("hidden_form_field", Map.of(
            "label", "Hidden Form Field",
            "description", "Off-screen honeypot input field invisible to users, auto-filled by scrapers",
            "status", "active",
            "hits", 0L
        ));
        traps.put("css_trap", Map.of(
            "label", "CSS Position Trap",
            "description", "Element positioned at -5000px off-screen with invisible internal link",
            "status", "active",
            "hits", cssHits
        ));
        traps.put("fake_comment", Map.of(
            "label", "Fake Debug Comment",
            "description", "HTML comment mentioning a fake debug endpoint — scrapers that parse comments find it",
            "status", "active",
            "hits", commentHits
        ));
        traps.put("js_decoy", Map.of(
            "label", "JS-Generated Decoy",
            "description", "JavaScript creates a hidden div with a trap link after page load",
            "status", "active",
            "hits", jsHits
        ));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalHoneypots", 5);
        response.put("totalTriggers", triggers.size());
        response.put("uniqueIPs", triggers.stream().map(t -> (String) t.get("ip")).filter(Objects::nonNull).distinct().count());
        response.put("traps", traps);
        response.put("recentTriggers", triggers.stream().limit(20).collect(Collectors.toList()));

        return ResponseEntity.ok(response);
    }
}
