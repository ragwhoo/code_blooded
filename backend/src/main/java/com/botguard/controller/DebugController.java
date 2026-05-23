package com.botguard.controller;

import com.botguard.features.BrowserFingerprintService;
import com.botguard.features.Ja3FingerprintService;
import com.botguard.mitigation.MitigationEngine;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/debug")
public class DebugController {

    private final Ja3FingerprintService ja3Service;
    private final BrowserFingerprintService fingerprintService;
    private final MitigationEngine mitigationEngine;

    public DebugController(Ja3FingerprintService ja3Service, BrowserFingerprintService fingerprintService, MitigationEngine mitigationEngine) {
        this.ja3Service = ja3Service;
        this.fingerprintService = fingerprintService;
        this.mitigationEngine = mitigationEngine;
    }

    @GetMapping("/ja3")
    public ResponseEntity<?> getJa3(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        Ja3FingerprintService.Ja3Result result = ja3Service.analyze(ua);
        return ResponseEntity.ok(Map.of(
            "userAgent", ua,
            "ja3Hash", result.hash(),
            "client", result.clientName(),
            "suspicionScore", result.suspicionScore()
        ));
    }

    @GetMapping("/fingerprint")
    public ResponseEntity<?> getFingerprint(HttpServletRequest request) {
        String sessionId = (String) request.getAttribute("sessionId");
        if (sessionId == null) return ResponseEntity.ok(Map.of("status", "no_session"));
        Map<String, Object> fp = fingerprintService.getFingerprint(sessionId);
        if (fp == null) return ResponseEntity.ok(Map.of("status", "no_fingerprint"));
        return ResponseEntity.ok(fp);
    }

    @PostMapping("/unblock")
    public ResponseEntity<?> unblock(@RequestBody Map<String, String> body) {
        String ip = body.getOrDefault("ip", "127.0.0.1");
        mitigationEngine.clearBlock(ip);
        return ResponseEntity.ok(Map.of("status", "unblocked", "ip", ip));
    }
}
