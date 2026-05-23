package com.botguard.scoring;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;
import com.botguard.reputation.ReputationService;

public class ReputationSignal implements WeightedSignal {
    private double weight = 0.3;
    private boolean enabled = true;
    private final ReputationService reputationService;

    public ReputationSignal(ReputationService reputationService) {
        this.reputationService = reputationService;
    }

    public void setWeight(double weight) { this.weight = weight; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    @Override public String getName() { return "reputation"; }
    @Override public double getWeight() { return weight; }
    @Override public boolean isEnabled() { return enabled; }
    @Override public String getDescription() { return "IP/session reputation score from Redis history"; }

    @Override
    public double computeScore(FeatureSnapshot features, SessionInfo session) {
        if (session == null || session.getIp() == null || reputationService == null) return 30;
        String ip = session.getIp();
        String sid = session.getSessionId();
        double rep = reputationService.getCombinedReputation(ip, sid != null ? sid : "", null);
        double botScore = (1.0 - rep) * 100;
        return Math.min(100, Math.max(0, botScore));
    }
}
