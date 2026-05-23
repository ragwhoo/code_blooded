package com.botguard.captcha;

public record CaptchaChallenge(String id, String problem, int answer) {}
