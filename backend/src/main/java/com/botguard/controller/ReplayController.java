package com.botguard.controller;

import com.botguard.replay.ReplayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/replay")
public class ReplayController {
    private final ReplayService replayService;

    public ReplayController(ReplayService replayService) {
        this.replayService = replayService;
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSessionReplay(@PathVariable String sessionId) {
        return ResponseEntity.ok(replayService.getSessionReplay(sessionId));
    }

    @GetMapping
    public ResponseEntity<?> getRecentSessions(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(Map.of("sessions", replayService.getRecentSessions(limit)));
    }
}
