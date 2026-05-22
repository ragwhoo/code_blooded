package com.botguard.listener;

import com.botguard.analytics.AnalyticsAggregatorService;
import com.botguard.analytics.AnalyticsService;
import com.botguard.event.DetectionEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsEventListener {
    private final AnalyticsService analyticsService;
    private final AnalyticsAggregatorService aggregatorService;

    public AnalyticsEventListener(AnalyticsService analyticsService, AnalyticsAggregatorService aggregatorService) {
        this.analyticsService = analyticsService;
        this.aggregatorService = aggregatorService;
    }

    @EventListener
    public void onEvent(DetectionEvent event) {
        analyticsService.recordEvent(event.getEnvelope());
        aggregatorService.record(event.getEnvelope());
    }
}
