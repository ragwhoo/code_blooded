package com.botguard.controller;

import com.botguard.service.SphinxToggleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sphinx")
public class SphinxToggleController {

    private final SphinxToggleService toggle;

    public SphinxToggleController(SphinxToggleService toggle) {
        this.toggle = toggle;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of("enabled", toggle.isEnabled()));
    }

    @PostMapping("/enable")
    public ResponseEntity<Map<String, Object>> enable() {
        toggle.setEnabled(true);
        return ResponseEntity.ok(Map.of("enabled", true));
    }

    @PostMapping("/disable")
    public ResponseEntity<Map<String, Object>> disable() {
        toggle.setEnabled(false);
        return ResponseEntity.ok(Map.of("enabled", false));
    }

    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggle() {
        boolean state = toggle.toggle();
        return ResponseEntity.ok(Map.of("enabled", state));
    }
}
