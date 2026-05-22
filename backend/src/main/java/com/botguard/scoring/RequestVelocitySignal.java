package com.botguard.scoring;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;

public class RequestVelocitySignal implements WeightedSignal {
    private double weight = 0.3;
    private boolean enabled = true;

    public void setWeight(double weight) { this.weight = weight; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    @Override public String getName() { return "requestVelocity"; }
    @Override public double getWeight() { return weight; }
    @Override public boolean isEnabled() { return enabled; }
    @Override public String getDescription() { return "Request rate and timing variance"; }

    @Override
    public double computeScore(FeatureSnapshot features, SessionInfo session) {
        double rpm = features.getRpm();
        double intervalVariance = features.getIntervalVariance();
        double rpmScore = Math.min(rpm / 60.0, 1.0) * 100;
        double varianceScore = Math.max(0, 100 - intervalVariance * 10);
        return (rpmScore * 0.6) + (varianceScore * 0.4);
    }
}
