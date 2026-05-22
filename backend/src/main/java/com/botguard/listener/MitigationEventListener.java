package com.botguard.listener;

import com.botguard.event.DetectionEvent;
import com.botguard.event.EventBusService;
import com.botguard.mitigation.MitigationEngine;
import com.botguard.model.EnvelopeEvent;
import com.botguard.model.EventType;
import com.botguard.model.MitigationAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class MitigationEventListener {
    private static final Logger log = LoggerFactory.getLogger(MitigationEventListener.class);
    private final MitigationEngine mitigationEngine;
    private final EventBusService eventBus;

    public MitigationEventListener(MitigationEngine mitigationEngine, EventBusService eventBus) {
        this.mitigationEngine = mitigationEngine;
        this.eventBus = eventBus;
    }

    @EventListener
    public void onDetection(DetectionEvent event) {
        EnvelopeEvent envelope = event.getEnvelope();
        if (envelope.getType() != EventType.DETECTION) return;

        Map<String, Object> payload = envelope.getPayload();
        if (payload == null) return;

        Number scoreNum = (Number) payload.get("riskScore");
        if (scoreNum == null) return;

        double score = scoreNum.doubleValue();
        String sessionId = envelope.getSessionId();
        String ipAddress = (String) payload.get("ipAddress");
        String fingerprint = (String) payload.get("fingerprint");

        MitigationAction action = mitigationEngine.evaluate(score, sessionId, ipAddress, fingerprint);

        if (action != MitigationAction.ALLOW) {
            log.info("Mitigation applied: session={}, score={}, action={}", sessionId, score, action);

            EnvelopeEvent mitigationEvent = new EnvelopeEvent(
                    EventType.MITIGATION, sessionId, envelope.getSeverity(),
                    Map.of("riskScore", score, "action", action.name(), "ipAddress", ipAddress));
            eventBus.publish(mitigationEvent);
        }
    }
}
