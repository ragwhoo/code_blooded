package com.botguard.controller;

import com.botguard.honeypot.HoneypotAnalyticsService;
import com.botguard.honeypot.HoneypotService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class HoneypotController {

    private static final Logger log = LoggerFactory.getLogger(HoneypotController.class);

    @Autowired
    private HoneypotService honeypotService;

    @Autowired
    private HoneypotAnalyticsService honeypotAnalyticsService;

    @GetMapping("/admin/panel")
    public ResponseEntity<String> adminPanel(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/api/internal/stats")
    public ResponseEntity<String> internalStats(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/wp-admin")
    public ResponseEntity<String> wpAdmin(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/backup")
    public ResponseEntity<String> backup(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/.env")
    public ResponseEntity<String> envFile(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/api/v2/salaries")
    public ResponseEntity<String> v2Salaries(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/api/internal/companies")
    public ResponseEntity<String> internalCompanies(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/graphql")
    public ResponseEntity<String> graphql(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/privacy-policy")
    public ResponseEntity<String> privacyPolicy(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/terms")
    public ResponseEntity<String> terms(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/tracking/pixel.gif")
    public ResponseEntity<String> trackingPixel(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @GetMapping("/analytics/collect")
    public ResponseEntity<String> analyticsCollect(HttpServletRequest request) {
        return serveHoneypotResponse(request);
    }

    @RequestMapping("/**")
    public ResponseEntity<String> dynamicHoneypot(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (honeypotService.isHoneypotPath(path)) {
            return serveHoneypotResponse(request);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/api/honeypots/stats")
    public ResponseEntity<?> getHoneypotStats() {
        return ResponseEntity.ok(honeypotAnalyticsService.getStats());
    }

    private ResponseEntity<String> serveHoneypotResponse(HttpServletRequest request) {
        String sessionId = (String) request.getAttribute("sessionId");
        if (sessionId != null) {
            honeypotService.recordHit(sessionId);
        }

        String fakeHtml = "<!DOCTYPE html><html><head><title>Redirecting...</title>"
                + "<meta http-equiv='refresh' content='0;url=/'></head>"
                + "<body><p>Loading...</p></body></html>";

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(fakeHtml);
    }
}
