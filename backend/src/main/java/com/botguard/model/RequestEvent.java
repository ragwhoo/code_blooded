package com.botguard.model;

import java.time.Instant;
import java.util.Map;

public record RequestEvent(
        String requestId,
        String ip,
        String sessionId,
        String userAgent,
        String path,
        Map<String, String> headers,
        String queryParams,
        Instant timestamp,
        Map<String, String> cookies,
        String referer
) {}
