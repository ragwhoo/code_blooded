package com.botguard.scoring;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;

public class HoneypotSignal implements WeightedSignal {
    private double weight = 0.5;
    private boolean enabled = true;

    public void setWeight(double weight) { this.weight = weight; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    @Override public String getName() { return "honeypot"; }
    @Override public double getWeight() { return weight; }
    @Override public boolean isEnabled() { return enabled; }
    @Override public String getDescription() { return "Honeypot interaction frequency"; }

    @Override
    public double computeScore(FeatureSnapshot features, SessionInfo session) {
        int honeypotHits = features.getHoneypotCount();
        return Math.min(honeypotHits * 25, 100);
    }
}
