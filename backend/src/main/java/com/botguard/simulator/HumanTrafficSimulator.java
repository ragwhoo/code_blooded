package com.botguard.simulator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class HumanTrafficSimulator {

    private static final Logger log = LoggerFactory.getLogger(HumanTrafficSimulator.class);

    private final RestTemplate restTemplate;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final Random random = new Random();

    private static final List<String> HUMAN_PATHS = List.of(
            "/api/companies",
            "/api/companies/1",
            "/api/companies/2",
            "/api/companies/3",
            "/api/companies/4",
            "/api/companies/5",
            "/api/salaries",
            "/api/companies/1/salary",
            "/api/companies/2/salary",
            "/api/companies/3/salary"
    );

    private static final List<String> ASSET_PATHS = List.of(
            "/styles.css", "/app.js", "/logo.png", "/favicon.ico",
            "/fonts/roboto.woff2", "/images/hero.svg"
    );

    public HumanTrafficSimulator() {
        this.restTemplate = new RestTemplateBuilder()
                .rootUri("http://localhost:8080")
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Scheduled(fixedDelay = 2000)
    public void simulateHumanTraffic() {
        if (!running.get()) return;

        int sessions = 1 + random.nextInt(3);
        for (int s = 0; s < sessions; s++) {
            new Thread(() -> {
                try {
                    simulateSingleSession();
                } catch (Exception e) {
                    log.debug("Human simulation request failed: {}", e.getMessage());
                }
            }, "human-sim-" + s).start();
        }
    }

    private void simulateSingleSession() {
        int requests = 2 + random.nextInt(6);

        for (int i = 0; i < requests; i++) {
            try {
                String path;
                if (i < requests - 1 && random.nextDouble() < 0.3) {
                    path = ASSET_PATHS.get(random.nextInt(ASSET_PATHS.size()));
                } else {
                    path = HUMAN_PATHS.get(random.nextInt(HUMAN_PATHS.size()));
                }

                String response = restTemplate.getForObject(path, String.class);
                log.debug("Human sim: GET {} -> {} bytes", path, response != null ? response.length() : 0);

                int pause = 500 + random.nextInt(2500);
                if (random.nextDouble() < 0.2) {
                    pause += 3000 + random.nextInt(5000);
                }
                Thread.sleep(pause);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.debug("Human sim request error: {}", e.getMessage());
            }
        }
    }

    public void start() {
        running.set(true);
        log.info("Human traffic simulator started");
    }

    public void stop() {
        running.set(false);
        log.info("Human traffic simulator stopped");
    }

    public boolean isRunning() {
        return running.get();
    }
}
