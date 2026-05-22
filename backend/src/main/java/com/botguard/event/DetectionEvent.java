package com.botguard.event;

import com.botguard.model.EnvelopeEvent;
import org.springframework.context.ApplicationEvent;

public class DetectionEvent extends ApplicationEvent {
    private final EnvelopeEvent envelope;

    public DetectionEvent(Object source, EnvelopeEvent envelope) {
        super(source);
        this.envelope = envelope;
    }

    public EnvelopeEvent getEnvelope() { return envelope; }
}
