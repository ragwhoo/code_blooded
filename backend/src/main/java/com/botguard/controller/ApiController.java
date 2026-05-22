package com.botguard.controller;

import com.botguard.analytics.AnalyticsService;
import com.botguard.analytics.TimeSeriesService;
import com.botguard.deception.DeceptionEngine;
import com.botguard.heuristics.HeuristicConfig;
import com.botguard.heuristics.HeuristicScoringService;
import com.botguard.model.AnalyticsEvent;
import com.botguard.model.RiskLevel;
import com.botguard.model.SessionInfo;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ApiController {

    private static final Logger log = LoggerFactory.getLogger(ApiController.class);

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private DeceptionEngine deceptionEngine;

    @Autowired
    private HeuristicScoringService heuristicScoringService;

    @Autowired
    private HeuristicConfig heuristicConfig;

    @Autowired
    private TimeSeriesService timeSeriesService;

    private final List<Map<String, Object>> companies = new ArrayList<>();
    private final List<Map<String, Object>> salaries = new ArrayList<>();
    private final Map<String, Map<String, Object>> companyDetails = new LinkedHashMap<>();
    private final Map<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        createCompanies();
        createSalaries();
    }

    private void createCompanies() {
        String[][] companyData = {
                {"Google", "Alphabet Inc", "Technology", "Mountain View, CA", "search,cloud,ai"},
                {"Meta", "Meta Platforms Inc", "Technology", "Menlo Park, CA", "social,reality-labs,ai"},
                {"Apple", "Apple Inc", "Technology", "Cupertino, CA", "hardware,software,services"},
                {"Netflix", "Netflix Inc", "Entertainment", "Los Gatos, CA", "streaming,content"},
                {"Amazon", "Amazon.com Inc", "Technology", "Seattle, WA", "ecommerce,cloud,logistics"},
                {"Microsoft", "Microsoft Corp", "Technology", "Redmond, WA", "software,cloud,gaming"},
                {"Spotify", "Spotify Technology SA", "Entertainment", "Stockholm, Sweden", "music,audio,podcasts"},
                {"Tesla", "Tesla Inc", "Automotive", "Austin, TX", "ev,energy,autonomous"},
                {"NVIDIA", "NVIDIA Corp", "Technology", "Santa Clara, CA", "gpu,ai,datacenter"},
                {"Uber", "Uber Technologies Inc", "Technology", "San Francisco, CA", "rideshare,delivery,freight"},
                {"Airbnb", "Airbnb Inc", "Technology", "San Francisco, CA", "travel,short-term-rentals"},
                {"Twitter", "Twitter Inc", "Technology", "San Francisco, CA", "social,media"},
                {"Stripe", "Stripe Inc", "Technology", "San Francisco, CA", "payments,fintech"},
                {"Palantir", "Palantir Technologies", "Technology", "Denver, CO", "data-analytics,defense"},
                {"Snowflake", "Snowflake Inc", "Technology", "Bozeman, MT", "data-cloud,analytics"},
                {"Datadog", "Datadog Inc", "Technology", "New York, NY", "monitoring,observability"},
                {"Coinbase", "Coinbase Global Inc", "Technology", "San Francisco, CA", "cryptocurrency,exchange"},
                {"Adobe", "Adobe Inc", "Technology", "San Jose, CA", "creative-software,marketing"},
                {"Salesforce", "Salesforce Inc", "Technology", "San Francisco, CA", "crm,enterprise-software"},
                {"Shopify", "Shopify Inc", "Technology", "Ottawa, Canada", "ecommerce,retail"},
                {"HashiCorp", "HashiCorp Inc", "Technology", "San Francisco, CA", "infrastructure,cloud"},
                {"Atlassian", "Atlassian Corp", "Technology", "Sydney, Australia", "dev-tools,project-management"},
                {"Zoom", "Zoom Video Comms", "Technology", "San Jose, CA", "video-conferencing"},
                {"Twilio", "Twilio Inc", "Technology", "San Francisco, CA", "communications,api"},
                {"Patreon", "Patreon Inc", "Technology", "San Francisco, CA", "membership,content"},
        };

        for (int i = 0; i < companyData.length; i++) {
            int id = i + 1;
            Map<String, Object> company = new LinkedHashMap<>();
            company.put("id", id);
            company.put("name", companyData[i][0]);
            company.put("fullName", companyData[i][1]);
            company.put("industry", companyData[i][2]);
            company.put("location", companyData[i][3]);
            company.put("sectors", List.of(companyData[i][4].split(",")));
            company.put("founded", 1995 + (int) (Math.random() * 25));
            company.put("employees", 1000 + (int) (Math.random() * 100000));
            companies.add(company);
            companyDetails.put(String.valueOf(id), company);
        }
    }

    private void createSalaries() {
        int[][] salaryData = {
                {120000, 350000, 220000}, {140000, 400000, 250000}, {130000, 380000, 240000},
                {150000, 450000, 280000}, {110000, 340000, 210000}, {130000, 370000, 240000},
                {100000, 300000, 180000}, {90000, 280000, 160000}, {160000, 500000, 300000},
                {95000, 290000, 170000}, {85000, 260000, 155000}, {115000, 330000, 200000},
                {125000, 360000, 225000}, {105000, 310000, 190000}, {135000, 390000, 250000},
                {120000, 350000, 220000}, {100000, 300000, 180000}, {110000, 320000, 195000},
                {115000, 340000, 205000}, {90000, 270000, 160000}, {130000, 380000, 235000},
                {110000, 330000, 200000}, {95000, 290000, 175000}, {105000, 310000, 190000},
                {85000, 250000, 150000}
        };

        String[] currencies = {"USD", "USD", "USD", "USD", "USD", "EUR", "USD", "USD", "USD", "USD",
                "CAD", "USD", "USD", "USD", "USD", "USD", "USD", "USD", "USD", "USD",
                "USD", "USD", "USD", "USD", "USD"};

        String[] roleTypes = {"SWE", "SWE", "MLE", "DS", "PM", "SWE", "SWE", "SWE", "MLE", "SWE",
                "SWE", "SWE", "DS", "SWE", "MLE", "SWE", "PM", "SWE", "SWE", "SWE",
                "MLE", "SWE", "SWE", "DS", "SWE"};

        String[] experienceLevels = {"mid", "senior", "senior", "mid", "senior", "staff", "mid",
                "senior", "senior", "mid", "senior", "staff", "mid", "senior", "senior",
                "mid", "senior", "staff", "mid", "senior", "senior", "mid", "senior",
                "staff", "senior"};

        for (int i = 0; i < salaryData.length; i++) {
            int companyId = i + 1;
            Map<String, Object> salary = new LinkedHashMap<>();
            salary.put("id", i + 1);
            salary.put("companyId", companyId);
            salary.put("companyName", companies.get(i).get("name"));
            salary.put("minSalary", salaryData[i][0]);
            salary.put("maxSalary", salaryData[i][1]);
            salary.put("avgSalary", salaryData[i][2]);
            salary.put("currency", currencies[i]);
            salary.put("roleType", roleTypes[i]);
            salary.put("experienceLevel", experienceLevels[i]);
            salary.put("remote", i % 3 != 0);
            salaries.add(salary);
        }
    }

    @GetMapping("/companies")
    public ResponseEntity<List<Map<String, Object>>> getCompanies(HttpServletRequest request) {
        log.debug("GET /api/companies from IP: {}", request.getRemoteAddr());
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/companies/{id}")
    public ResponseEntity<?> getCompany(@PathVariable String id, HttpServletRequest request) {
        log.debug("GET /api/companies/{} from IP: {}", id, request.getRemoteAddr());
        Map<String, Object> company = companyDetails.get(id);
        if (company == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(company);
    }

    @GetMapping("/companies/{id}/salary")
    public ResponseEntity<?> getCompanySalary(@PathVariable String id, HttpServletRequest request) {
        log.debug("GET /api/companies/{}/salary from IP: {}", id, request.getRemoteAddr());
        String sessionId = (String) request.getAttribute("sessionId");

        int companyId = Integer.parseInt(id);
        List<Map<String, Object>> companySalaries = salaries.stream()
                .filter(s -> (int) s.get("companyId") == companyId)
                .collect(Collectors.toList());

        if (companySalaries.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No salary data available for this company"));
        }

        Object result = companySalaries;
        if (sessionId != null) {
            RiskLevel riskLevel = (RiskLevel) request.getAttribute("riskLevel");
            if (riskLevel == null) riskLevel = RiskLevel.NORMAL;
            result = deceptionEngine.processResponse(new ArrayList<>(companySalaries), riskLevel);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/salaries")
    public ResponseEntity<List<Map<String, Object>>> getSalaries(HttpServletRequest request) {
        log.debug("GET /api/salaries from IP: {}", request.getRemoteAddr());
        return ResponseEntity.ok(salaries);
    }

    @GetMapping("/analytics/stats")
    public ResponseEntity<Map<String, Object>> getAnalyticsStats() {
        return ResponseEntity.ok(analyticsService.getStats());
    }

    @GetMapping("/analytics/sessions")
    public ResponseEntity<Collection<SessionInfo>> getActiveSessions() {
        return ResponseEntity.ok(activeSessions.values());
    }

    @GetMapping("/analytics/sessions/{id}")
    public ResponseEntity<?> getSessionDetail(@PathVariable String id) {
        SessionInfo info = activeSessions.get(id);
        if (info == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(info);
    }

    @GetMapping("/config/heuristics")
    public ResponseEntity<?> getHeuristicConfig() {
        return ResponseEntity.ok(Map.of("rules", heuristicConfig.getRules()));
    }

    @GetMapping("/analytics/events")
    public ResponseEntity<List<AnalyticsEvent>> getRecentEvents(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(analyticsService.getRecentEvents(limit));
    }

    @GetMapping("/analytics/timeseries")
    public ResponseEntity<?> getTimeSeries(@RequestParam(defaultValue = "30") int minutes) {
        return ResponseEntity.ok(Map.of("series", timeSeriesService.getTimeSeries(minutes)));
    }

    @GetMapping("/analytics/bot-vs-human")
    public ResponseEntity<?> getBotVsHuman(@RequestParam(defaultValue = "60") int minutes) {
        return ResponseEntity.ok(timeSeriesService.getBotVsHuman(minutes));
    }

    @GetMapping("/analytics/risk-distribution")
    public ResponseEntity<?> getRiskDistribution() {
        return ResponseEntity.ok(Map.of("distribution", timeSeriesService.getRiskDistribution()));
    }

    @GetMapping("/analytics/mitigation-distribution")
    public ResponseEntity<?> getMitigationDistribution() {
        return ResponseEntity.ok(Map.of("distribution", timeSeriesService.getMitigationDistribution()));
    }
}
