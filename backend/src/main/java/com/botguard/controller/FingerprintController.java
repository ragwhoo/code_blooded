package com.botguard.controller;

import com.botguard.features.BrowserFingerprintService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/fingerprint")
public class FingerprintController {
    private final BrowserFingerprintService fingerprintService;

    public FingerprintController(BrowserFingerprintService fingerprintService) {
        this.fingerprintService = fingerprintService;
    }

    @PostMapping("/collect")
    public ResponseEntity<?> collectFingerprint(@RequestBody Map<String, Object> fp, HttpServletRequest request) {
        String sessionId = (String) request.getAttribute("sessionId");
        if (sessionId != null) {
            fingerprintService.recordFingerprint(sessionId, fp);
        }
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
