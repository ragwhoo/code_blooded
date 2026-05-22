package com.botguard.scoring;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;

public class ReputationSignal implements WeightedSignal {
    private double weight = 0.3;
    private boolean enabled = true;

    public void setWeight(double weight) { this.weight = weight; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    @Override public String getName() { return "reputation"; }
    @Override public double getWeight() { return weight; }
    @Override public boolean isEnabled() { return enabled; }
    @Override public String getDescription() { return "IP/session reputation score"; }

    @Override
    public double computeScore(FeatureSnapshot features, SessionInfo session) {
        return 30;
    }
}
