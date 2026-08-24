package com.platform.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Gateway routing table — see /docs/INTEGRATION.md §5 "Routes du Gateway".
 *
 * All routes are pure passthrough (no path rewriting): each downstream
 * service exposes its routes under the same prefix the frontend calls
 * through the Gateway, so a plain {@code uri(...)} without a
 * {@code StripPrefix}/{@code RewritePath} filter is correct.
 *
 * Whether a route requires a valid JWT (and which extra authorization rules
 * apply, e.g. {@code user_type=agency} for prospection) is enforced by
 * {@link com.platform.gateway.filter.AuthenticationFilter}, not here — the
 * table below only decides where a request is forwarded.
 */
@Configuration
public class GatewayConfig {

    /**
     * Placeholder target for the "frappe" route. Frappe can run in a
     * container or on the Docker host and that choice can change at
     * runtime (cf. docs/FRAPPE_FALLBACK.md), so a fixed {@code .uri(...)}
     * per docs/INTEGRATION.md §5 cannot decide the real target — this value
     * is only used to give the route a syntactically valid scheme/host/port
     * at build time. {@link com.platform.gateway.filter.FrappeDynamicRoutingFilter}
     * overwrites it on every request that actually hits this route with the
     * URL {@link FrappeUrlResolver} currently resolves to — see that
     * filter's Javadoc for why a static route can't do this on its own.
     */
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
                // /api/method/platform_core.api.auth.** (public) and
                // /api/method/platform_core.api.** (JWT required), plus
                // /api/resource/**, /files/** and /private/files/** all
                // target Frappe. The public/JWT-required distinction is
                // decided by AuthenticationFilter based on the exact method
                // name, not by the route itself.
                //
                // .uri(frappeUrl) below only seeds scheme/host/port for route
                // matching/building; FrappeDynamicRoutingFilter rewrites the
                // actual target on every request (container/local fallback,
                // see its Javadoc and docs/FRAPPE_FALLBACK.md). The route id
                // "frappe" here MUST stay in sync with FRAPPE_ROUTE_ID there.
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
                // Socket.IO: websocket (and its HTTP long-polling fallback)
                // upgrade route to notifications-service. Auth token travels
                // as a query param (?token=...) and is validated by
                // notifications-service itself (§5) — AuthenticationFilter
                // deliberately skips /socket.io/**.
                .route("notifications-ws", r -> r
                        .path("/socket.io/**")
                        .uri(toWebSocketUri(notificationsUrl)))
                .build();
    }

    /** Converts an http(s):// base URL into the equivalent ws(s):// URL used for the websocket route. */
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
