package com.botguard.event;

import com.botguard.model.EnvelopeEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class EventBusService {
    private static final Logger log = LoggerFactory.getLogger(EventBusService.class);
    private final ApplicationEventPublisher publisher;

    public EventBusService(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void publish(EnvelopeEvent event) {
        log.debug("Publishing event: type={}, sessionId={}, severity={}",
                event.getType(), event.getSessionId(), event.getSeverity());
        publisher.publishEvent(new DetectionEvent(this, event));
    }
}
