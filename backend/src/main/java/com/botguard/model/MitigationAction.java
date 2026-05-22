package com.botguard.model;

public enum MitigationAction {
    ALLOW,
    SOFT_THROTTLE,
    ARTIFICIAL_DELAY,
    RATE_LIMIT,
    CAPTCHA_SIM,
    POW_SIM,
    TEMP_BLOCK
}
