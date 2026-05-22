package com.botguard.controller;

import com.botguard.simulator.BotTrafficSimulator;
import com.botguard.simulator.HumanTrafficSimulator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/simulator")
public class SimulatorController {

    @Autowired
    private HumanTrafficSimulator humanTrafficSimulator;

    @Autowired
    private BotTrafficSimulator botTrafficSimulator;

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> start() {
        humanTrafficSimulator.start();
        botTrafficSimulator.start();
        return ResponseEntity.ok(Map.of(
                "status", "started",
                "humanSimulator", true,
                "botSimulator", true
        ));
    }

    @PostMapping("/stop")
    public ResponseEntity<Map<String, Object>> stop() {
        humanTrafficSimulator.stop();
        botTrafficSimulator.stop();
        return ResponseEntity.ok(Map.of(
                "status", "stopped",
                "humanSimulator", false,
                "botSimulator", false
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
                "humanSimulator", humanTrafficSimulator.isRunning(),
                "botSimulator", botTrafficSimulator.isRunning()
        ));
    }
}
