package com.botguard.scoring;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WeightedSignalRegistry {
    private static final Logger log = LoggerFactory.getLogger(WeightedSignalRegistry.class);
    private static final String WEIGHTS_KEY = "scoring:weights:global";

    private final StringRedisTemplate redis;
    private final Map<String, WeightedSignal> signals = new ConcurrentHashMap<>();
    private final Map<String, Double> weightOverrides = new ConcurrentHashMap<>();

    public WeightedSignalRegistry(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @PostConstruct
    public void registerDefaults() {
        register(new RequestVelocitySignal());
        register(new HoneypotSignal());
        register(new FingerprintSignal());
        register(new BehaviorEntropySignal());
        register(new ReputationSignal());
        loadWeights();
    }

    public void register(WeightedSignal signal) {
        signals.put(signal.getName(), signal);
    }

    public WeightedSignal get(String name) { return signals.get(name); }
    public List<WeightedSignal> getAll() { return List.copyOf(signals.values()); }

    public List<WeightedSignal> getEnabled() {
        return signals.values().stream().filter(WeightedSignal::isEnabled).toList();
    }

    public void loadWeights() {
        Map<Object, Object> stored = redis.opsForHash().entries(WEIGHTS_KEY);
        if (stored == null || stored.isEmpty()) {
            for (WeightedSignal s : signals.values()) {
                redis.opsForHash().put(WEIGHTS_KEY, s.getName(), String.valueOf(s.getWeight()));
            }
            return;
        }
        stored.forEach((name, weightStr) -> {
            String nameStr = (String) name;
            if (weightStr instanceof String) {
                try {
                    weightOverrides.put(nameStr, Double.parseDouble((String) weightStr));
                } catch (NumberFormatException e) {
                    log.warn("Invalid weight for {}: {}", nameStr, weightStr);
                }
            }
        });
    }

    public double getEffectiveWeight(String name) {
        return weightOverrides.getOrDefault(name,
                signals.getOrDefault(name, null) != null ? signals.get(name).getWeight() : 0);
    }

    @Scheduled(fixedRate = 30000)
    public void refreshWeights() {
        loadWeights();
    }
}
