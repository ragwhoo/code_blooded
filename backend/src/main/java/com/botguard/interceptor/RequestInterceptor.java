package com.botguard.interceptor;

import com.botguard.event.EventBusService;
import com.botguard.features.FeatureExtractionService;
import com.botguard.heuristics.HeuristicScoringService;
import com.botguard.mitigation.MitigationEngine;
import com.botguard.model.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Instant;
import java.util.*;

@Component
public class RequestInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RequestInterceptor.class);
    private static final String SESSION_COOKIE = "BOTGUARD_SESSION";

    @Autowired
    private FeatureExtractionService featureExtractionService;

    @Autowired
    private HeuristicScoringService heuristicScoringService;

    @Autowired
    private MitigationEngine mitigationEngine;

    @Autowired
    private EventBusService eventBusService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String sessionId = getOrCreateSessionId(request, response);
        String ip = getClientIp(request);
        long startTime = System.currentTimeMillis();

        request.setAttribute("sessionId", sessionId);
        request.setAttribute("startTime", startTime);

        featureExtractionService.asyncProcess(sessionId, request.getRequestURI());

        FeatureSnapshot snapshot = featureExtractionService.extractFeatures(sessionId);
        SessionInfo sessionInfo = buildSessionInfo(sessionId, ip, request.getRequestURI());

        BotScore botScore = heuristicScoringService.score(snapshot, sessionInfo);
        sessionInfo.setScore(botScore.score());
        sessionInfo.setRiskLevel(botScore.riskLevel());

        String fingerprint = botScore.breakdown() != null
                ? botScore.breakdown().toString()
                : null;

        MitigationAction action = mitigationEngine.evaluate(botScore.score(), sessionId, ip, fingerprint);
        sessionInfo.setMitigationAction(action);

        // Apply response-level effects (headers, status codes, delays)
        applyResponseEffects(action, request, response, botScore);

        // Publish unified event to EventBus (all listeners process it)
        Map<String, Object> payload = new HashMap<>();
        payload.put("riskScore", botScore.score());
        payload.put("level", botScore.riskLevel().name());
        payload.put("mitigationAction", action.name());
        payload.put("ipAddress", ip);
        payload.put("fingerprint", fingerprint);
        payload.put("userAgent", request.getHeader("User-Agent"));
        payload.put("path", request.getRequestURI());
        payload.put("method", request.getMethod());

        SeverityLevel severity = SeverityLevel.fromScore(botScore.score());
        EnvelopeEvent envelope = new EnvelopeEvent(EventType.DETECTION, sessionId, severity, payload);
        eventBusService.publish(envelope);

        return true;
    }

    private void applyResponseEffects(MitigationAction action, HttpServletRequest request,
                                       HttpServletResponse response, BotScore botScore) {
        switch (action) {
            case ALLOW -> {}
            case SOFT_THROTTLE -> {
                sleep(500);
                response.setHeader("X-BotGuard-Throttle", "500");
            }
            case ARTIFICIAL_DELAY -> {
                int delayMs = 1000 + new Random().nextInt(2000);
                sleep(delayMs);
                response.setHeader("X-BotGuard-Delay", String.valueOf(delayMs));
            }
            case RATE_LIMIT -> {
                response.setStatus(429);
                response.setHeader("Retry-After", "60");
                response.setHeader("X-BotGuard-RateLimit", "true");
            }
            case CAPTCHA_SIM -> {
                response.setHeader("X-BotGuard-Captcha", "true");
                response.setHeader("X-BotGuard-Captcha-Type", "recaptcha-v2");
                response.setHeader("X-BotGuard-Challenge", "captcha_required");
            }
            case POW_SIM -> {
                response.setHeader("X-BotGuard-PoW", "true");
                response.setHeader("X-BotGuard-PoW-Difficulty", "5");
                response.setHeader("X-BotGuard-Challenge", "pow_required");
            }
            case TEMP_BLOCK -> {
                response.setStatus(403);
                response.setHeader("X-BotGuard-Blocked", "true");
                response.setHeader("Retry-After", "60");
            }
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String sessionId = (String) request.getAttribute("sessionId");
        if (sessionId != null) {
            Long startTime = (Long) request.getAttribute("startTime");
            if (startTime != null) {
                long duration = System.currentTimeMillis() - startTime;
                log.debug("Session {} request completed in {}ms", sessionId, duration);
            }
        }
    }

    private String getOrCreateSessionId(HttpServletRequest request, HttpServletResponse response) {
        if (request.getCookies() != null) {
            Optional<String> existing = Arrays.stream(request.getCookies())
                    .filter(c -> SESSION_COOKIE.equals(c.getName()))
                    .map(jakarta.servlet.http.Cookie::getValue)
                    .findFirst();
            if (existing.isPresent()) {
                return existing.get();
            }
        }
        String newSessionId = UUID.randomUUID().toString();
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie(SESSION_COOKIE, newSessionId);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(86400);
        response.addCookie(cookie);
        return newSessionId;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private SessionInfo buildSessionInfo(String sessionId, String ip, String path) {
        SessionInfo info = new SessionInfo(sessionId, ip);
        info.getPaths().add(path);
        info.getTimestamps().add(System.currentTimeMillis());
        info.setRequestCount(1);
        return info;
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
