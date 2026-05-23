package com.botguard.honeypot;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1)
public class HoneypotFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(HoneypotFilter.class);

    @Autowired
    private HoneypotService honeypotService;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        String path = req.getRequestURI();

        if (honeypotService.isHoneypotPath(path)) {
            String sessionId = (String) req.getAttribute("sessionId");
            if (sessionId != null) {
                honeypotService.recordHit(sessionId);
            }
            String fakeHtml = "<!DOCTYPE html><html><head><title>Redirecting...</title>"
                    + "<meta http-equiv='refresh' content='0;url=/'></head>"
                    + "<body><p>Loading...</p></body></html>";
            resp.setContentType(MediaType.TEXT_HTML_VALUE);
            resp.getWriter().write(fakeHtml);
            return;
        }

        chain.doFilter(request, response);
    }
}
