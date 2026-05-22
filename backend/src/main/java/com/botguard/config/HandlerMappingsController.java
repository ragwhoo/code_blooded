package com.botguard.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.handler.AbstractHandlerMapping;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
public class HandlerMappingsController {

    @Autowired
    private List<HandlerMapping> handlerMappings;

    @GetMapping("/api/diag/mappings")
    public List<String> getMappings() {
        List<String> result = new ArrayList<>();
        for (HandlerMapping hm : handlerMappings) {
            result.add(hm.getClass().getName());
            if (hm instanceof AbstractHandlerMapping) {
                AbstractHandlerMapping ahm = (AbstractHandlerMapping) hm;
                try {
                    var field = AbstractHandlerMapping.class.getDeclaredField("handlerMap");
                    field.setAccessible(true);
                    Map<?, ?> map = (Map<?, ?>) field.get(ahm);
                    if (map != null) {
                        for (Object key : map.keySet()) {
                            result.add("  " + key);
                        }
                    }
                } catch (Exception e) {
                    result.add("  (could not get handler map: " + e.getMessage() + ")");
                }
            }
        }
        return result;
    }
}
