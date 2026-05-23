package com.botguard.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class SphinxToggleService {
    private final AtomicBoolean enabled = new AtomicBoolean(true);

    public boolean isEnabled() { return enabled.get(); }
    public void setEnabled(boolean value) { enabled.set(value); }
    public boolean toggle() {
        boolean prev = enabled.get();
        enabled.set(!prev);
        return !prev;
    }
}
