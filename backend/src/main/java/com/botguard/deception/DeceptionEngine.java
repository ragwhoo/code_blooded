package com.botguard.deception;

import com.botguard.model.RiskLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DeceptionEngine {

    private static final Logger log = LoggerFactory.getLogger(DeceptionEngine.class);

    private final Map<String, List<Map<String, Object>>> poisonedCache = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public List<Map<String, Object>> poisonSalaryData(List<Map<String, Object>> realData) {
        String cacheKey = "salary_" + System.currentTimeMillis() / 60000;
        if (poisonedCache.containsKey(cacheKey)) {
            return poisonedCache.get(cacheKey);
        }

        List<Map<String, Object>> poisoned = new ArrayList<>();
        for (Map<String, Object> entry : realData) {
            if (random.nextDouble() < 0.4) {
                Map<String, Object> modified = new HashMap<>(entry);
                modifySalaryValues(modified);
                poisoned.add(modified);
            } else {
                poisoned.add(new HashMap<>(entry));
            }
        }

        Collections.shuffle(poisoned);
        poisonedCache.put(cacheKey, poisoned);
        log.info("Generated poisoned salary data: {} entries", poisoned.size());
        return poisoned;
    }

    private void modifySalaryValues(Map<String, Object> entry) {
        if (entry.containsKey("minSalary")) {
            int original = ((Number) entry.get("minSalary")).intValue();
            entry.put("minSalary", original - random.nextInt(30000) - 10000);
        }
        if (entry.containsKey("maxSalary")) {
            int original = ((Number) entry.get("maxSalary")).intValue();
            entry.put("maxSalary", original - random.nextInt(50000) - 20000);
        }
        if (entry.containsKey("avgSalary")) {
            int original = ((Number) entry.get("avgSalary")).intValue();
            entry.put("avgSalary", original - random.nextInt(40000) - 15000);
        }
        if (entry.containsKey("currency")) {
            entry.put("currency", "USD"); // always USD in poisoned data
        }
        entry.put("stale", true);
        entry.put("dataQuality", "estimated");
    }

    public int poisonPagination(int totalPages) {
        int inflated = Math.max(totalPages, (int) (totalPages * (1.5 + random.nextDouble())));
        log.debug("Poisoned pagination: {} -> {} pages", totalPages, inflated);
        return inflated;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> degradeResponseData(Map<String, Object> data) {
        Map<String, Object> degraded = new HashMap<>();
        Set<String> fieldsToKeep = new HashSet<>(Arrays.asList("id", "name", "type"));
        for (String key : data.keySet()) {
            if (fieldsToKeep.contains(key)) {
                degraded.put(key, data.get(key));
            }
        }
        degraded.put("truncated", true);
        degraded.put("message", "Detailed data available after verification");
        log.debug("Degraded response data: kept {} of {} fields", degraded.size(), data.size());
        return degraded;
    }

    public Map<String, Object> injectHoneytokens(Map<String, Object> data) {
        Map<String, Object> withTokens = new HashMap<>(data);
        withTokens.put("_debug", UUID.randomUUID().toString());
        withTokens.put("_internal_id", "internal_" + System.currentTimeMillis());
        withTokens.put("_checksum", Integer.toHexString(data.hashCode()));
        withTokens.put("_trace", "tracer_" + random.nextInt(99999));
        log.debug("Injected {} honeytokens into response", 4);
        return withTokens;
    }

    public boolean shouldApplyDeception(RiskLevel riskLevel) {
        return riskLevel == RiskLevel.CONFIRMED_BOT || riskLevel == RiskLevel.LIKELY_BOT;
    }

    @SuppressWarnings("unchecked")
    public Object processResponse(Object data, RiskLevel riskLevel) {
        if (!shouldApplyDeception(riskLevel)) return data;

        if (data instanceof List) {
            List<?> list = (List<?>) data;
            if (!list.isEmpty() && list.get(0) instanceof Map) {
                return poisonSalaryData((List<Map<String, Object>>) data);
            }
            int size = list.size();
            int subsetSize = Math.max(1, size / 3);
            return list.subList(0, subsetSize);
        }

        if (data instanceof Map) {
            Map<String, Object> degraded = degradeResponseData((Map<String, Object>) data);
            return injectHoneytokens(degraded);
        }

        return data;
    }
}
