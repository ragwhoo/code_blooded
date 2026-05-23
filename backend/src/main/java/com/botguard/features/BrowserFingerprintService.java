package com.botguard.features;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BrowserFingerprintService {
    private static final Logger log = LoggerFactory.getLogger("[FINGERPRINT] " + BrowserFingerprintService.class.getName());
    private final ConcurrentHashMap<String, Map<String, Object>> fingerprints = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void recordFingerprint(String sessionId, Map<String, Object> fp) {
        fingerprints.put(sessionId, fp);
        log.info("FINGERPRINT_COLLECTED for session: {}", sessionId);
    }

    public boolean hasValidFingerprint(String sessionId) {
        return fingerprints.containsKey(sessionId);
    }

    public boolean isHeadless(String sessionId) {
        Map<String, Object> fp = fingerprints.get(sessionId);
        if (fp == null) return true;
        Boolean webdriver = (Boolean) fp.getOrDefault("webdriver", false);
        Number plugins = (Number) fp.getOrDefault("plugins", 0);
        if (Boolean.TRUE.equals(webdriver)) {
            log.info("FINGERPRINT_HEADLESS_DETECTED for session: {}", sessionId);
            return true;
        }
        if (plugins != null && plugins.intValue() == 0) {
            log.info("FINGERPRINT_HEADLESS_DETECTED for session: {}", sessionId);
            return true;
        }
        return false;
    }

    public Map<String, Object> getFingerprint(String sessionId) {
        return fingerprints.get(sessionId);
    }
}
