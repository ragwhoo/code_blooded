package com.botguard.features;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class CrawlerWhitelistService {
    private static final List<Pattern> KNOWN_CRAWLERS = List.of(
        Pattern.compile("Googlebot", Pattern.CASE_INSENSITIVE),
        Pattern.compile("Bingbot", Pattern.CASE_INSENSITIVE),
        Pattern.compile("Slurp", Pattern.CASE_INSENSITIVE),
        Pattern.compile("DuckDuckBot", Pattern.CASE_INSENSITIVE),
        Pattern.compile("Baiduspider", Pattern.CASE_INSENSITIVE),
        Pattern.compile("YandexBot", Pattern.CASE_INSENSITIVE),
        Pattern.compile("facebookexternalhit", Pattern.CASE_INSENSITIVE),
        Pattern.compile("Twitterbot", Pattern.CASE_INSENSITIVE),
        Pattern.compile("LinkedInBot", Pattern.CASE_INSENSITIVE),
        Pattern.compile("Applebot", Pattern.CASE_INSENSITIVE),
        Pattern.compile("SemrushBot", Pattern.CASE_INSENSITIVE),
        Pattern.compile("AhrefsBot", Pattern.CASE_INSENSITIVE)
    );

    public boolean isWhitelisted(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return false;
        return KNOWN_CRAWLERS.stream().anyMatch(p -> p.matcher(userAgent).find());
    }
}
