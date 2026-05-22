package com.botguard.heuristics;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class HeuristicConfig {

    private static final Logger log = LoggerFactory.getLogger(HeuristicConfig.class);
    private List<HeuristicRule> rules = new ArrayList<>();

    @PostConstruct
    public void init() {
        try {
            Yaml yaml = new Yaml();
            InputStream inputStream = getClass().getClassLoader().getResourceAsStream("heuristics-config.yml");
            if (inputStream != null) {
                Map<String, Object> config = yaml.load(inputStream);
                List<Map<String, Object>> ruleMaps = (List<Map<String, Object>>) config.get("rules");
                if (ruleMaps != null) {
                    for (Map<String, Object> ruleMap : ruleMaps) {
                        HeuristicRule rule = new HeuristicRule();
                        rule.setName((String) ruleMap.get("name"));
                        rule.setWeight((Integer) ruleMap.get("weight"));
                        rule.setDescription((String) ruleMap.get("description"));
                        rule.setEnabled((Boolean) ruleMap.get("enabled"));
                        rule.setCondition((String) ruleMap.get("condition"));
                        rules.add(rule);
                    }
                }
                log.info("Loaded {} heuristic rules from heuristics-config.yml", rules.size());
            }
        } catch (Exception e) {
            log.error("Failed to load heuristics config, using defaults", e);
            loadDefaultRules();
        }
        if (rules.isEmpty()) {
            loadDefaultRules();
        }
    }

    private void loadDefaultRules() {
        rules.add(new HeuristicRule("rapid_requests", 20, "Requests per minute exceeds threshold", true, "rpm > 30"));
        rules.add(new HeuristicRule("sequential_traversal", 25, "Sequential URL pattern detected", true, "sequentialRatio > 0.6"));
        rules.add(new HeuristicRule("no_assets", 15, "No CSS/JS/image assets requested", true, "assetRatio < 0.05"));
        rules.add(new HeuristicRule("honeypot_hit", 70, "Honeypot/trap route accessed", true, "honeypotCount > 0"));
        rules.add(new HeuristicRule("low_entropy", 15, "Navigation entropy below threshold", true, "navigationEntropy < 1.5"));
        rules.add(new HeuristicRule("high_salary_ratio", 20, "High proportion of salary page hits", true, "salaryPageRatio > 0.5"));
        rules.add(new HeuristicRule("low_interval_variance", 25, "Request intervals are too regular", true, "intervalVariance < 100"));
        rules.add(new HeuristicRule("repeated_pattern", 15, "Repeated URL access pattern detected", true, "repeatedPatternScore > 0.7"));
    }

    public List<HeuristicRule> getRules() { return rules; }
}
