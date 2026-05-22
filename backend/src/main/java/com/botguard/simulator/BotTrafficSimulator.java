package com.botguard.simulator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class BotTrafficSimulator {

    private static final Logger log = LoggerFactory.getLogger(BotTrafficSimulator.class);

    private final RestTemplate restTemplate;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final Random random = new Random();
    private final Map<String, AtomicInteger> botCounters = new ConcurrentHashMap<>();

    private static final List<String> STATIC_HONEYPOT_PATHS = List.of(
            "/admin/panel", "/api/internal/stats", "/wp-admin", "/backup", "/.env",
            "/api/v2/salaries", "/api/internal/companies", "/graphql"
    );

    public BotTrafficSimulator() {
        this.restTemplate = new RestTemplateBuilder()
                .rootUri("http://localhost:8080")
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Scheduled(fixedDelay = 1500)
    public void simulateBotTraffic() {
        if (!running.get()) return;

        int sessions = 2 + random.nextInt(4);
        for (int s = 0; s < sessions; s++) {
            String botId = "bot-" + UUID.randomUUID().toString().substring(0, 8);
            new Thread(() -> {
                try {
                    if (random.nextDouble() < 0.3) {
                        simulateSalaryScraper(botId);
                    } else if (random.nextDouble() < 0.5) {
                        simulateHoneypotTrigger(botId);
                    } else {
                        simulateRapidRequestor(botId);
                    }
                } catch (Exception e) {
                    log.debug("Bot simulation request failed: {}", e.getMessage());
                }
            }, "bot-sim-" + s).start();
        }
    }

    private void simulateSalaryScraper(String botId) {
        AtomicInteger counter = botCounters.computeIfAbsent(botId, k -> new AtomicInteger(0));
        int startId = counter.getAndIncrement() % 20 + 1;

        for (int i = 0; i < 5; i++) {
            try {
                int companyId = startId + i;
                String path = "/api/companies/" + companyId + "/salary";
                String response = restTemplate.getForObject(path, String.class);
                log.debug("Bot salary-scraper {}: GET {} -> {} bytes", botId, path,
                        response != null ? response.length() : 0);
                Thread.sleep(50 + random.nextInt(150));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.debug("Bot salary-scraper error: {}", e.getMessage());
            }
        }
    }

    private void simulateHoneypotTrigger(String botId) {
        for (int i = 0; i < 3; i++) {
            try {
                String path = STATIC_HONEYPOT_PATHS.get(random.nextInt(STATIC_HONEYPOT_PATHS.size()));
                String response = restTemplate.getForObject(path, String.class);
                log.debug("Bot honeypot-trigger {}: GET {} -> {} bytes", botId, path,
                        response != null ? response.length() : 0);
                Thread.sleep(100 + random.nextInt(200));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.debug("Bot honeypot trigger error: {}", e.getMessage());
            }
        }
    }

    private void simulateRapidRequestor(String botId) {
        List<String> paths = List.of("/api/companies", "/api/companies/1/salary",
                "/api/companies/2/salary", "/api/companies/3/salary",
                "/api/companies/4/salary", "/api/salaries");

        for (int i = 0; i < 8; i++) {
            try {
                String path = paths.get(random.nextInt(paths.size()));
                String response = restTemplate.getForObject(path, String.class);
                log.debug("Bot rapid-requestor {}: GET {} -> {} bytes", botId, path,
                        response != null ? response.length() : 0);
                Thread.sleep(50 + random.nextInt(100));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.debug("Bot rapid request error: {}", e.getMessage());
            }
        }
    }

    public void start() {
        running.set(true);
        log.info("Bot traffic simulator started");
    }

    public void stop() {
        running.set(false);
        log.info("Bot traffic simulator stopped");
    }

    public boolean isRunning() {
        return running.get();
    }
}
