package com.botguard.listener;

import com.botguard.event.DetectionEvent;
import com.botguard.model.EnvelopeEvent;
import com.botguard.model.EventType;
import com.botguard.model.SeverityLevel;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketEventListener {
    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @EventListener
    public void onEvent(DetectionEvent event) {
        EnvelopeEvent envelope = event.getEnvelope();

        try {
            // All events to /topic/events
            messagingTemplate.convertAndSend("/topic/events", envelope);

            // HIGH/CRITICAL to /topic/threats
            if (envelope.getSeverity() == SeverityLevel.HIGH || envelope.getSeverity() == SeverityLevel.CRITICAL) {
                messagingTemplate.convertAndSend("/topic/threats", envelope);
            }

            // Mitigation events to /topic/mitigations
            if (envelope.getType() == EventType.MITIGATION) {
                messagingTemplate.convertAndSend("/topic/mitigations", envelope);
            }

        } catch (Exception e) {
            log.error("Failed to publish event to WebSocket: {}", e.getMessage());
        }
    }
}
