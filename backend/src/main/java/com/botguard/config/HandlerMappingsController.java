package com.botguard.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;

@Controller
@ResponseBody
public class HandlerMappingsController {

    @Autowired
    private List<HandlerMapping> handlerMappings;

    @GetMapping("/_diag/mappings")
    public List<String> getMappings() {
        List<String> result = new ArrayList<>();
        for (HandlerMapping hm : handlerMappings) {
            int order = (hm instanceof Ordered) ? ((Ordered) hm).getOrder() : 0;
            result.add(hm.getClass().getName() + " order=" + order);
        }
        return result;
    }

    @GetMapping("/_diag/ws-test")
    public String testWs(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        for (HandlerMapping hm : handlerMappings) {
            try {
                HandlerExecutionChain chain = hm.getHandler(request);
                String result = (chain != null) ? "HANDLED by " + chain.getHandler().toString() : "null";
                String name = hm.getClass().getSimpleName();
                if (name.equals("WebSocketHandlerMapping") && chain == null) {
                    result = "null (PATTERN EXISTS BUT NO MATCH)";
                }
                sb.append(name).append(" -> ").append(result).append(" | ");
            } catch (Exception e) {
                sb.append(hm.getClass().getSimpleName()).append(" -> ERROR: ").append(e.getMessage()).append(" | ");
            }
        }
        return sb.toString();
    }
}
