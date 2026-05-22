package com.botguard.fingerprint;

import com.botguard.model.FingerprintResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class FingerprintValidator {

    private static final Logger log = LoggerFactory.getLogger(FingerprintValidator.class);

    private static final Pattern CHROME_UA = Pattern.compile(
            "Mozilla/5\\.0.*(Windows NT|Mac OS X|Linux|Android|iPhone).*Chrome/.*",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern FIREFOX_UA = Pattern.compile(
            "Mozilla/5\\.0.*(Windows NT|Mac OS X|Linux|Android|iPhone).*Firefox/.*",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SAFARI_UA = Pattern.compile(
            "Mozilla/5\\.0.*(Mac OS X|iPhone|iPad).*AppleWebKit/.*Safari/.*",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern EDGE_UA = Pattern.compile(
            "Mozilla/5\\.0.*(Windows NT).*Edg/.*",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern HEADLESS_CHROME = Pattern.compile(
            "HeadlessChrome|PhantomJS|Selenium|Puppeteer|Playwright",
            Pattern.CASE_INSENSITIVE);

    private static final Set<String> EXPECTED_HEADERS = Set.of(
            "accept", "accept-encoding", "accept-language", "user-agent"
    );

    public FingerprintResult validate(String userAgent, Map<String, String> headers) {
        List<String> anomalies = new ArrayList<>();
        double confidenceScore = 0;

        if (userAgent == null || userAgent.isBlank()) {
            anomalies.add("Missing User-Agent header");
            confidenceScore += 0.3;
        } else {
            if (HEADLESS_CHROME.matcher(userAgent).find()) {
                anomalies.add("Headless browser signature detected");
                confidenceScore += 0.4;
            }
            if (!CHROME_UA.matcher(userAgent).matches() &&
                    !FIREFOX_UA.matcher(userAgent).matches() &&
                    !SAFARI_UA.matcher(userAgent).matches() &&
                    !EDGE_UA.matcher(userAgent).matches()) {
                anomalies.add("Unrecognized browser User-Agent");
                confidenceScore += 0.15;
            }
        }

        long missingExpectedHeaders = EXPECTED_HEADERS.stream()
                .filter(h -> !headers.containsKey(h))
                .count();
        if (missingExpectedHeaders > 0) {
            anomalies.add("Missing " + missingExpectedHeaders + " standard HTTP headers");
            confidenceScore += missingExpectedHeaders * 0.05;
        }

        String acceptHeader = headers.getOrDefault("accept", "");
        if (acceptHeader.isEmpty() || "*/*".equals(acceptHeader)) {
            anomalies.add("Accept header is missing or too permissive");
            confidenceScore += 0.1;
        }

        String acceptLanguage = headers.getOrDefault("accept-language", "");
        if (acceptLanguage.isEmpty()) {
            anomalies.add("Missing Accept-Language header");
            confidenceScore += 0.1;
        }

        String secCHUA = headers.getOrDefault("sec-ch-ua", "");
        if (secCHUA.isEmpty()) {
            anomalies.add("Missing Sec-CH-UA header (modern browsers send this)");
            confidenceScore += 0.05;
        }

        boolean suspicious = confidenceScore > 0.2;
        FingerprintResult result = new FingerprintResult(suspicious, anomalies, Math.min(1.0, confidenceScore));
        log.debug("Fingerprint validation: suspicious={}, anomalies={}, confidence={}",
                suspicious, anomalies, String.format("%.2f", confidenceScore));
        return result;
    }

    public String computeFingerprintHash(String userAgent, String ip, Map<String, String> headers) {
        String raw = userAgent + "|" + ip + "|" + headers.getOrDefault("accept-encoding", "")
                + "|" + headers.getOrDefault("accept-language", "")
                + "|" + headers.getOrDefault("sec-ch-ua", "");
        return Integer.toHexString(raw.hashCode());
    }
}
