package com.botguard.captcha;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/captcha")
public class CaptchaController {
    private final CaptchaService captchaService;

    public CaptchaController(CaptchaService captchaService) {
        this.captchaService = captchaService;
    }

    @GetMapping("/challenge")
    public ResponseEntity<?> getChallenge(@RequestParam String sessionId) {
        CaptchaChallenge challenge = captchaService.generateChallenge(sessionId);
        return ResponseEntity.ok(Map.of(
            "id", challenge.id(),
            "problem", challenge.problem(),
            "answer", challenge.answer()
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, Object> body) {
        String id = (String) body.get("id");
        int answer = ((Number) body.get("answer")).intValue();
        boolean verified = captchaService.verify(id, answer);
        return ResponseEntity.ok(Map.of("verified", verified));
    }
}
