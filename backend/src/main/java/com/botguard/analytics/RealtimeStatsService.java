package com.botguard.analytics;

import com.botguard.model.EnvelopeEvent;
import com.botguard.model.EventType;
import com.botguard.model.SeverityLevel;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RealtimeStatsService {
    private static final Logger log = LoggerFactory.getLogger(RealtimeStatsService.class);

    private final AnalyticsService analyticsService;
    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeStatsService(AnalyticsService analyticsService, SimpMessagingTemplate messagingTemplate) {
        this.analyticsService = analyticsService;
        this.messagingTemplate = messagingTemplate;
    }

    @Scheduled(fixedRate = 2000)
    public void broadcastStats() {
        try {
            Map<String, Object> stats = analyticsService.getStats();
            EnvelopeEvent envelope = new EnvelopeEvent(
                    EventType.ANALYTICS, null, SeverityLevel.LOW, stats
            );
            messagingTemplate.convertAndSend("/topic/stats", envelope);
        } catch (Exception e) {
            log.error("Failed to broadcast stats: {}", e.getMessage());
        }
    }
}
