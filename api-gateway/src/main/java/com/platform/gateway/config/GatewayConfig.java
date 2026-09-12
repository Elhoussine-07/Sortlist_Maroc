package com.platform.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Value("${services.frappe-url-container:http://frappe:8000}")
    private String frappeUrl;

    @Value("${services.matching-url:http://matching-service:8081}")
    private String matchingUrl;

    @Value("${services.ia-url:http://ia-service:8083}")
    private String iaUrl;

    @Value("${services.prospection-url:http://prospection-service:8084}")
    private String prospectionUrl;

    @Value("${services.notifications-url:http://notifications-service:8085}")
    private String notificationsUrl;

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                
                .route("frappe", r -> r
                        .path("/api/method/**", "/api/resource/**", "/files/**", "/private/files/**")
                        .uri(frappeUrl))
                .route("matching-service", r -> r
                        .path("/api/matching/**")
                        .uri(matchingUrl))
                .route("ia-service", r -> r
                        .path("/api/ia/**")
                        .uri(iaUrl))
                .route("prospection-service", r -> r
                        .path("/api/prospection/**")
                        .uri(prospectionUrl))
                
                .route("notifications-ws", r -> r
                        .path("/socket.io/**")
                        .uri(toWebSocketUri(notificationsUrl)))
                .build();
    }

    private static String toWebSocketUri(String httpUrl) {
        if (httpUrl.startsWith("https://")) {
            return "wss://" + httpUrl.substring("https://".length());
        }
        if (httpUrl.startsWith("http://")) {
            return "ws://" + httpUrl.substring("http://".length());
        }
        return httpUrl;
    }
}
