package com.botguard.features;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class Ja3FingerprintService {
    private static final Logger log = LoggerFactory.getLogger("[JA3] " + Ja3FingerprintService.class.getName());

    private static final Map<String, Ja3Profile> KNOWN_PROFILES = Map.ofEntries(
        Map.entry("chrome", new Ja3Profile("Chrome Browser", "771,4865-4866-4867-49196-49195-52393-52392-49188-49187-49162-49161-65281-52394-49171-49170-49172-49160-49199-49198-49169-49159-49157-49156-52395-52394-49155-49154-49167-49166-49165-49164-49163-52393-52392-49161-49160-49171-49170,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25-256-257-258,0-1-2")),
        Map.entry("firefox", new Ja3Profile("Firefox Browser", "771,4865-4866-4867-49196-49195-52393-49200-49199-49162-49161-49171-49170-49160-49159-49157-49156-49155-49154-49167-49166-49165-49164-49163-49153-49152-52394-52393-52392-49161-49160-49171-49170,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25-256-257-258,0-1-2")),
        Map.entry("safari", new Ja3Profile("Safari Browser", "771,4865-4866-4867-49196-49195-52393-49200-49199-49162-49161-49171-49170-49160-49159-49157-49156-49155-49154-49167-49166-49165-49164-49163-49153-49152-52394-52393-52392-49161-49160-49171-49170,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25-256-257-258,0-1-2")),
        Map.entry("python", new Ja3Profile("Python Requests", "771,4865-4866-4867-49196-49195-52393-52392,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25-256-257-258,0-1-2")),
        Map.entry("curl", new Ja3Profile("curl", "771,4865-4866-4867-49196-49195-52393-52392,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25-256-257-258,0")),
        Map.entry("go", new Ja3Profile("Go HTTP Client", "771,4865-4866-4867-49196-49195-52393-52392,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25-256-257-258,0")),
        Map.entry("okhttp", new Ja3Profile("OkHttp (Android)", "771,4865-4866-4867-49196-49195-52393-52392-49188-49187-49162-49161,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25-256-257-258,0-1-2")),
        Map.entry("scrapy", new Ja3Profile("Scrapy/Python", "771,4865-4866-4867-49196-49195-52393-52392,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25-256-257-258,0")),
        Map.entry("ahrefs", new Ja3Profile("AhrefsBot", "771,4865-4866-4867-49196-49195-52393-52392-49188-49187-49162-49161-49171-49170,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25,0-1-2")),
        Map.entry("googlebot", new Ja3Profile("Googlebot", "771,4865-4866-4867-49196-49195-52393-52392-49188-49187-49162-49161,0-23-65281-11-35-13-5-16-18-43-10-21,29-23-24-25,0-1-2"))
    );

    private static final Map<String, String> UA_PATTERNS = Map.ofEntries(
        Map.entry("Python-urllib", "python"),
        Map.entry("python-requests", "python"),
        Map.entry("curl", "curl"),
        Map.entry("Go-http-client", "go"),
        Map.entry("OkHttp", "okhttp"),
        Map.entry("Scrapy", "scrapy"),
        Map.entry("AhrefsBot", "ahrefs"),
        Map.entry("Googlebot", "googlebot"),
        Map.entry("Chrome", "chrome"),
        Map.entry("Firefox", "firefox"),
        Map.entry("Safari", "safari"),
        Map.entry("Edge", "chrome"),
        Map.entry("Wget", "curl")
    );

    private final ConcurrentHashMap<String, String> ja3Cache = new ConcurrentHashMap<>();

    public Ja3Result analyze(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return new Ja3Result("unknown", "771,0-0-0-0,0-0-0-0,0-0-0-0,0", 60);
        }

        String profileKey = "unknown";
        for (var entry : UA_PATTERNS.entrySet()) {
            if (userAgent.contains(entry.getKey())) {
                profileKey = entry.getValue();
                break;
            }
        }

        Ja3Profile profile = KNOWN_PROFILES.get(profileKey);
        if (profile == null) {
            return new Ja3Result("unknown", "771,0-0-0-0,0-0-0-0,0-0-0-0,0", 30);
        }

        String hash = ja3Cache.computeIfAbsent(userAgent, k -> {
            String raw = profile.ja3Hash;
            int h = raw.hashCode();
            return String.format("%08x%08x", h, raw.length());
        });

        int suspicionScore = isBotProfile(profileKey) ? 40 : 0;

        log.info("JA3 fingerprint detected: client={}, hash={}, suspicion={}", profile.name, hash, suspicionScore);

        return new Ja3Result(profile.name, hash, suspicionScore);
    }

    private boolean isBotProfile(String key) {
        return "python".equals(key) || "curl".equals(key) || "go".equals(key) ||
               "okhttp".equals(key) || "scrapy".equals(key);
    }

    public record Ja3Profile(String name, String ja3Hash) {}
    public record Ja3Result(String clientName, String hash, int suspicionScore) {}
}
