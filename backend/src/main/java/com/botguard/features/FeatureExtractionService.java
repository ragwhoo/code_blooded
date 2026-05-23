package com.botguard.features;

import com.botguard.model.FeatureSnapshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class FeatureExtractionService {

    private static final Logger log = LoggerFactory.getLogger(FeatureExtractionService.class);
    private static final String TIMESTAMPS_KEY = "ts:%s";
    private static final String PATHS_KEY = "paths:%s";
    private static final String HONEYPOT_KEY = "hp:%s";
    private static final long WINDOW_MS = 60000;

    @Autowired
    private StringRedisTemplate redis;

    public void asyncProcess(String sessionId, String path) {
        long now = System.currentTimeMillis();
        redis.opsForZSet().add(String.format(TIMESTAMPS_KEY, sessionId), String.valueOf(now), now);
        redis.opsForList().rightPush(String.format(PATHS_KEY, sessionId), path);
        redis.expire(String.format(TIMESTAMPS_KEY, sessionId), java.time.Duration.ofMinutes(5));
        redis.expire(String.format(PATHS_KEY, sessionId), java.time.Duration.ofMinutes(5));
    }

    public FeatureSnapshot extractFeatures(String sessionId) {
        FeatureSnapshot snapshot = new FeatureSnapshot();
        long now = System.currentTimeMillis();
        long windowStart = now - WINDOW_MS;

        Set<String> rawTimestamps = redis.opsForZSet().rangeByScore(
                String.format(TIMESTAMPS_KEY, sessionId), windowStart, now);
        List<Long> timestamps = rawTimestamps.stream()
                .map(Long::parseLong)
                .sorted()
                .collect(Collectors.toList());

        List<String> paths = redis.opsForList().range(String.format(PATHS_KEY, sessionId), 0, -1);
        if (paths == null) paths = new ArrayList<>();

        String honeypotCountStr = redis.opsForValue().get(String.format(HONEYPOT_KEY, sessionId));
        int honeypotCount = honeypotCountStr != null ? Integer.parseInt(honeypotCountStr) : 0;

        snapshot.setRpm(computeRpm(timestamps, now));
        snapshot.setAvgInterval(computeAvgInterval(timestamps));
        snapshot.setIntervalVariance(computeIntervalVariance(timestamps));
        snapshot.setSequentialRatio(computeSequentialRatio(paths));
        snapshot.setNavigationEntropy(computeNavigationEntropy(paths));
        snapshot.setSalaryPageRatio(computeSalaryPageRatio(paths));
        snapshot.setAssetRatio(computeAssetRatio(paths));
        snapshot.setHoneypotCount(honeypotCount);
        snapshot.setRepeatedPatternScore(computeRepeatedPatternScore(paths));

        return snapshot;
    }

    private int computeRpm(List<Long> timestamps, long now) {
        long cutoff = now - 60000;
        return (int) timestamps.stream().filter(t -> t >= cutoff).count();
    }

    private double computeAvgInterval(List<Long> timestamps) {
        if (timestamps.size() < 2) return 0;
        double total = 0;
        for (int i = 1; i < timestamps.size(); i++) {
            total += timestamps.get(i) - timestamps.get(i - 1);
        }
        return total / (timestamps.size() - 1);
    }

    private double computeIntervalVariance(List<Long> timestamps) {
        if (timestamps.size() < 3) return 0;
        double mean = computeAvgInterval(timestamps);
        double sumSquaredDiffs = 0;
        int count = 0;
        for (int i = 1; i < timestamps.size(); i++) {
            double diff = (timestamps.get(i) - timestamps.get(i - 1)) - mean;
            sumSquaredDiffs += diff * diff;
            count++;
        }
        return count > 0 ? sumSquaredDiffs / count : 0;
    }

    private double computeSequentialRatio(List<String> paths) {
        if (paths.size() < 2) return 0;
        Pattern sequentialPattern = Pattern.compile(".*/\\d+$");
        int sequential = 0;
        for (int i = 1; i < paths.size(); i++) {
            String prev = paths.get(i - 1);
            String curr = paths.get(i);
            if (sequentialPattern.matcher(curr).matches()) {
                try {
                    int prevNum = extractTrailingNumber(prev);
                    int currNum = extractTrailingNumber(curr);
                    if (currNum == prevNum + 1) {
                        sequential++;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        return (double) sequential / (paths.size() - 1);
    }

    private int extractTrailingNumber(String path) {
        String[] segments = path.split("/");
        for (int i = segments.length - 1; i >= 0; i--) {
            try {
                return Integer.parseInt(segments[i]);
            } catch (NumberFormatException ignored) {}
        }
        throw new NumberFormatException("No number found in path: " + path);
    }

    private double computeNavigationEntropy(List<String> paths) {
        if (paths.isEmpty()) return 0;
        Map<String, Long> segmentCounts = new HashMap<>();
        for (String path : paths) {
            String[] segments = path.split("/");
            for (String seg : segments) {
                if (!seg.isEmpty()) {
                    segmentCounts.merge(seg, 1L, Long::sum);
                }
            }
        }
        double total = paths.stream().mapToInt(p -> p.split("/").length).sum();
        double entropy = 0;
        for (long count : segmentCounts.values()) {
            double p = count / total;
            if (p > 0) {
                entropy -= p * (Math.log(p) / Math.log(2));
            }
        }
        return entropy;
    }

    private double computeSalaryPageRatio(List<String> paths) {
        if (paths.isEmpty()) return 0;
        long salaryHits = paths.stream().filter(p -> p.contains("/salary") || p.contains("/salaries")).count();
        return (double) salaryHits / paths.size();
    }

    private double computeAssetRatio(List<String> paths) {
        if (paths.isEmpty()) return 0;
        long assetHits = paths.stream()
                .filter(p -> p.endsWith(".css") || p.endsWith(".js") || p.endsWith(".png")
                        || p.endsWith(".jpg") || p.endsWith(".gif") || p.endsWith(".svg")
                        || p.endsWith(".ico") || p.endsWith(".woff") || p.endsWith(".woff2"))
                .count();
        return (double) assetHits / paths.size();
    }

    private double computeRepeatedPatternScore(List<String> paths) {
        if (paths.size() < 4) return 0;
        Map<String, Integer> patternCounts = new HashMap<>();
        for (int i = 0; i <= paths.size() - 3; i++) {
            String pattern = String.join("|", paths.get(i), paths.get(i + 1), paths.get(i + 2));
            patternCounts.merge(pattern, 1, Integer::sum);
        }
        int maxRepetition = patternCounts.values().stream().max(Integer::compareTo).orElse(0);
        int totalPatterns = Math.max(1, paths.size() - 2);
        return (double) maxRepetition / totalPatterns;
    }
}
