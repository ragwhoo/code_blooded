package com.botguard.scoring;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;

public class BehaviorEntropySignal implements WeightedSignal {
    private double weight = 0.2;
    private boolean enabled = true;

    public void setWeight(double weight) { this.weight = weight; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    @Override public String getName() { return "behaviorEntropy"; }
    @Override public double getWeight() { return weight; }
    @Override public boolean isEnabled() { return enabled; }
    @Override public String getDescription() { return "Navigation pattern entropy"; }

    @Override
    public double computeScore(FeatureSnapshot features, SessionInfo session) {
        double entropy = features.getNavigationEntropy();
        return Math.max(0, 100 - entropy * 20);
    }
}
