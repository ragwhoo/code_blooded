package com.botguard.honeypot;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Component
public class HoneypotConfig {

    private static final Logger log = LoggerFactory.getLogger(HoneypotConfig.class);
    private Map<String, Object> honeypots = Map.of();

    @PostConstruct
    public void init() {
        try {
            Yaml yaml = new Yaml();
            InputStream inputStream = getClass().getClassLoader().getResourceAsStream("honeypot-config.yml");
            if (inputStream != null) {
                Map<String, Object> raw = yaml.load(inputStream);
                this.honeypots = (Map<String, Object>) raw.get("honeypots");
                log.info("Loaded honeypot config");
            }
        } catch (Exception e) {
            log.error("Failed to load honeypot config, using defaults", e);
        }
    }

    public Map<String, Object> getHoneypots() { return honeypots; }
    public void setHoneypots(Map<String, Object> honeypots) { this.honeypots = honeypots; }

    @SuppressWarnings("unchecked")
    public List<String> getHiddenRoutes() {
        return (List<String>) honeypots.getOrDefault("hidden_routes", List.of());
    }

    @SuppressWarnings("unchecked")
    public List<String> getFakeEndpoints() {
        return (List<String>) honeypots.getOrDefault("fake_endpoints", List.of());
    }

    @SuppressWarnings("unchecked")
    public List<String> getInvisibleLinks() {
        return (List<String>) honeypots.getOrDefault("invisible_links", List.of());
    }

    @SuppressWarnings("unchecked")
    public List<String> getJsTraps() {
        return (List<String>) honeypots.getOrDefault("js_traps", List.of());
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getDynamicHoneypots() {
        return (Map<String, Object>) honeypots.getOrDefault("dynamic_honeypots", Map.of());
    }

    public boolean isDynamicEnabled() {
        Map<String, Object> dyn = getDynamicHoneypots();
        return dyn != null && Boolean.TRUE.equals(dyn.get("enabled"));
    }

    public int getRotationIntervalMinutes() {
        Map<String, Object> dyn = getDynamicHoneypots();
        if (dyn != null && dyn.get("rotation_interval_minutes") instanceof Integer) {
            return (Integer) dyn.get("rotation_interval_minutes");
        }
        return 10;
    }

    public int getPoolSize() {
        Map<String, Object> dyn = getDynamicHoneypots();
        if (dyn != null && dyn.get("pool_size") instanceof Integer) {
            return (Integer) dyn.get("pool_size");
        }
        return 20;
    }

    public List<String> getAllStaticRoutes() {
        List<String> all = new java.util.ArrayList<>();
        all.addAll(getHiddenRoutes());
        all.addAll(getFakeEndpoints());
        all.addAll(getInvisibleLinks());
        all.addAll(getJsTraps());
        return all;
    }
}
