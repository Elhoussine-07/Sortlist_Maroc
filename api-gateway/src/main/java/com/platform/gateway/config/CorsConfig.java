package com.platform.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * CORS is open to the frontend origin only ({@code FRONTEND_URL}, see
 * /docs/INTEGRATION.md �2 and �9). The frontend talks exclusively to the
 * Gateway (and directly to notifications-service for Socket.IO), so this is
 * the single place CORS needs to be configured.
 *
 * ⚠️ DÉSACTIVÉ : Le CORS est désormais géré par application.yml
 */
// @Configuration  // ← DÉSACTIVÉ pour éviter le double header CORS
public class CorsConfig {

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // @Bean  // ← DÉSACTIVÉ pour éviter le double header CORS
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendUrl));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-User-Email",
                "X-User-Type",
                "X-Agency-Id",
                "X-Internal-Token"
        ));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return new CorsWebFilter(source);
    }
}
