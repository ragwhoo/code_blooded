package com.botguard.scoring;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;

public class FingerprintSignal implements WeightedSignal {
    private double weight = 0.4;
    private boolean enabled = true;

    public void setWeight(double weight) { this.weight = weight; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    @Override public String getName() { return "fingerprint"; }
    @Override public double getWeight() { return weight; }
    @Override public boolean isEnabled() { return enabled; }
    @Override public String getDescription() { return "Browser fingerprint anomalies"; }

    @Override
    public double computeScore(FeatureSnapshot features, SessionInfo session) {
        String ua = session.getUserAgent();
        if (ua == null || ua.isBlank()) return 70;
        if (ua.contains("Headless") || ua.contains("PhantomJS") || ua.contains("curl")) return 90;
        if (!ua.contains("Mozilla") && !ua.contains("Chrome") && !ua.contains("Safari")) return 50;
        return 10;
    }
}
