package com.botguard.geo;

import com.botguard.model.EnvelopeEvent;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class GeoEnricher {
    private final GeoIpService geoIpService;

    public GeoEnricher(GeoIpService geoIpService) {
        this.geoIpService = geoIpService;
    }

    public void enrich(EnvelopeEvent event) {
        if (event.getPayload() == null) return;
        String ip = (String) event.getPayload().get("ipAddress");
        if (ip == null) return;
        GeoLocation geo = geoIpService.lookup(ip);
        if (geo != null) {
            event.getPayload().put("geo_country", geo.getCountry());
            event.getPayload().put("geo_countryCode", geo.getCountryCode());
            event.getPayload().put("geo_city", geo.getCity());
            event.getPayload().put("geo_asn", String.valueOf(geo.getAsn()));
            event.getPayload().put("geo_isp", geo.getIsp());
        }
    }
}
