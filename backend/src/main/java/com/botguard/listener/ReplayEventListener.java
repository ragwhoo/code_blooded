package com.botguard.listener;

import com.botguard.event.DetectionEvent;
import com.botguard.replay.ReplayRecorder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ReplayEventListener {
    private static final Logger log = LoggerFactory.getLogger(ReplayEventListener.class);
    private final ReplayRecorder replayRecorder;

    public ReplayEventListener(ReplayRecorder replayRecorder) {
        this.replayRecorder = replayRecorder;
    }

    @EventListener
    public void onEvent(DetectionEvent event) {
        replayRecorder.record(event.getEnvelope());
    }
}
