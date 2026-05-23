package com.botguard.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class HoneytrapInjector {

    private static final List<String> TRAP_LINKS = List.of(
        "/api/target/honeypot/admin-config",
        "/api/target/honeypot/wp-admin",
        "/api/target/honeypot/backup.sql",
        "/api/target/honeypot/.env",
        "/api/target/honeypot/api-docs",
        "/api/target/honeypot/salary-data-export"
    );

    private static final List<String> TRAP_LABELS = List.of(
        "Admin Configuration Panel",
        "WordPress Dashboard",
        "Database Backup",
        "Environment Configuration",
        "API Documentation",
        "Salary Data Export"
    );

    private int trapIndex = 0;

    public record InjectedResult(String html, List<String> trapPaths) {}

    public InjectedResult inject(String originalHtml, String requestPath) {
        String id = UUID.randomUUID().toString().substring(0, 6);
        StringBuilder sb = new StringBuilder(originalHtml);
        List<String> trapPaths = new java.util.ArrayList<>();

        // 1. Hidden trap links
        for (int i = 0; i < 3; i++) {
            int idx = (trapIndex + i) % TRAP_LINKS.size();
            String trapPath = TRAP_LINKS.get(idx) + "?tid=" + id;
            String label = TRAP_LABELS.get(idx);

            String trapLink = String.format(
                "<a href=\"%s\" style=\"display:none;position:absolute;left:-9999px\" data-honeytrap=\"%s\">%s</a>\n",
                trapPath, id, label
            );
            int bodyClose = sb.lastIndexOf("</body>");
            if (bodyClose > 0) sb.insert(bodyClose, trapLink);
            else sb.append(trapLink);

            trapPaths.add(trapPath);
        }

        // 2. Hidden form field
        String hiddenField = String.format(
            "<input type=\"text\" name=\"email_confirm_%s\" style=\"position:absolute;top:-100px;left:-100px;opacity:0\" tabindex=\"-1\" autocomplete=\"off\">\n",
            id
        );
        int bodyClose = sb.lastIndexOf("</body>");
        if (bodyClose > 0) sb.insert(bodyClose, hiddenField);
        else sb.append(hiddenField);

        // 3. CSS trap (element positioned off-screen, invisible to humans)
        String cssTrap = String.format(
            "<div data-honeytrap=\"css-%s\" style=\"position:absolute;top:-5000px;left:-5000px;width:1px;height:1px;overflow:hidden;opacity:0.001;pointer-events:none\">\n" +
            "  <a href=\"/api/target/honeypot/internal-link?tid=%s\">Internal Server</a>\n" +
            "</div>\n",
            id, id
        );
        bodyClose = sb.lastIndexOf("</body>");
        if (bodyClose > 0) sb.insert(bodyClose, cssTrap);
        else sb.append(cssTrap);

        // 4. Fake comment with sensitive-looking data (scrapers crawl comments too)
        String fakeComment = String.format(
            "<!-- TODO: remove debug endpoint /api/target/honeypot/debug-endpoint?tid=%s before production -->\n",
            id
        );
        int headClose = sb.lastIndexOf("</head>");
        if (headClose > 0) sb.insert(headClose, fakeComment);

        // 5. JavaScript honeypot trigger
        String jsTrap = String.format(
            "<script>\n" +
            "(function(){const d=document.createElement('div');d.style.display='none';d.id='honeypot-%s';" +
            "d.innerHTML='<a href=\"/api/target/honeypot/js-trigger?tid=%s\">hidden</a>';" +
            "document.body.appendChild(d);})();\n" +
            "</script>\n",
            id, id
        );
        bodyClose = sb.lastIndexOf("</body>");
        if (bodyClose > 0) sb.insert(bodyClose, jsTrap);
        else sb.append(jsTrap);

        trapIndex++;

        return new InjectedResult(sb.toString(), trapPaths);
    }
}
