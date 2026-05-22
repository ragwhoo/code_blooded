package com.botguard.scoring;

import com.botguard.model.FeatureSnapshot;
import com.botguard.model.SessionInfo;

public interface WeightedSignal {
    String getName();
    double getWeight();
    double computeScore(FeatureSnapshot features, SessionInfo session);
    boolean isEnabled();
    String getDescription();
}
