package com.botguard.controller;

import com.botguard.scoring.WeightedSignal;
import com.botguard.scoring.WeightedSignalRegistry;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/config")
public class ScoringConfigController {
    private final WeightedSignalRegistry registry;
    private final StringRedisTemplate redis;
    private static final String WEIGHTS_KEY = "scoring:weights:global";

    public ScoringConfigController(WeightedSignalRegistry registry, StringRedisTemplate redis) {
        this.registry = registry;
        this.redis = redis;
    }

    @GetMapping("/scoring-weights")
    public ResponseEntity<?> getWeights() {
        List<Map<String, Object>> signals = registry.getAll().stream()
                .map(s -> Map.<String, Object>of(
                        "name", s.getName(),
                        "weight", registry.getEffectiveWeight(s.getName()),
                        "enabled", s.isEnabled(),
                        "description", s.getDescription()
                )).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("signals", signals));
    }

    @PutMapping("/scoring-weights")
    public ResponseEntity<?> updateWeights(@RequestBody Map<String, Object> body) {
        Object signalsRaw = body.get("signals");
        if (signalsRaw instanceof List) {
            for (Object o : (List<?>) signalsRaw) {
                if (o instanceof Map) {
                    Map<?, ?> signal = (Map<?, ?>) o;
                    String name = (String) signal.get("name");
                    Number weight = (Number) signal.get("weight");
                    if (name != null && weight != null) {
                        redis.opsForHash().put(WEIGHTS_KEY, name, String.valueOf(weight.doubleValue()));
                    }
                }
            }
        }
        registry.loadWeights();
        return ResponseEntity.ok(Map.of("status", "updated"));
    }
}
