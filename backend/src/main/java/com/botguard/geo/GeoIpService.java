package com.botguard.geo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class GeoIpService {
    private static final Logger log = LoggerFactory.getLogger(GeoIpService.class);
    private static final String CACHE_PREFIX = "geo:ip:";
    private static final long CACHE_TTL = 86400;

    private final StringRedisTemplate redis;

    public GeoIpService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public GeoLocation lookup(String ip) {
        if (ip == null || ip.isBlank()) return null;

        // Check cache
        String cacheKey = CACHE_PREFIX + ip;
        Map<Object, Object> cached = redis.opsForHash().entries(cacheKey);
        if (cached != null && !cached.isEmpty()) {
            GeoLocation loc = new GeoLocation();
            loc.setCountry((String) cached.get("country"));
            loc.setCountryCode((String) cached.get("countryCode"));
            loc.setCity((String) cached.get("city"));
            loc.setAsn(cached.get("asn") != null ? Long.parseLong((String) cached.get("asn")) : 0);
            loc.setIsp((String) cached.get("isp"));
            loc.setLatitude(cached.get("lat") != null ? Double.parseDouble((String) cached.get("lat")) : 0);
            loc.setLongitude(cached.get("lon") != null ? Double.parseDouble((String) cached.get("lon")) : 0);
            return loc;
        }

        try {
            InetAddress addr = InetAddress.getByName(ip);

            // Simplified geo inference based on IP range
            // In production, use MaxMind GeoLite2 database
            GeoLocation loc = new GeoLocation();
            loc.setCountry("Unknown");
            loc.setCountryCode("XX");
            loc.setCity("Unknown");
            loc.setAsn(0);
            loc.setIsp("Unknown");

            // Infer cloud providers from well-known ranges (simplified)
            String host = addr.getHostAddress();
            if (host != null) {
                if (host.startsWith("3.") || host.startsWith("18.") || host.startsWith("52.")) {
                    loc.setIsp("AWS");
                } else if (host.startsWith("34.") || host.startsWith("35.") || host.startsWith("8.8.")) {
                    loc.setIsp("Google Cloud");
                } else if (host.startsWith("40.") || host.startsWith("13.") || host.startsWith("20.")) {
                    loc.setIsp("Azure");
                } else if (host.startsWith("104.") || host.startsWith("161.") || host.startsWith("162.")) {
                    loc.setIsp("DigitalOcean");
                }
            }

            // Cache in Redis
            Map<String, String> cacheData = Map.of(
                    "country", loc.getCountry(),
                    "countryCode", loc.getCountryCode(),
                    "city", loc.getCity(),
                    "asn", String.valueOf(loc.getAsn()),
                    "isp", loc.getIsp(),
                    "lat", String.valueOf(loc.getLatitude()),
                    "lon", String.valueOf(loc.getLongitude())
            );
            redis.opsForHash().putAll(cacheKey, cacheData);
            redis.expire(cacheKey, CACHE_TTL, TimeUnit.SECONDS);

            return loc;

        } catch (Exception e) {
            log.debug("Geo lookup failed for IP {}: {}", ip, e.getMessage());
            return null;
        }
    }
}
