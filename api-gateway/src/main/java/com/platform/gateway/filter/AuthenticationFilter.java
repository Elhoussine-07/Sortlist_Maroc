package com.platform.gateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.platform.gateway.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/**
 * Global gateway filter implementing /docs/INTEGRATION.md §3 "Authentification".
 *
 * <ul>
 *   <li>Skips JWT validation entirely on the public Frappe routes listed in
 *       §5 "Routes Frappe publiques" (allow_guest=True endpoints), on
 *       {@code /actuator/**} (health checks), and on {@code /socket.io/**}
 *       (Socket.IO carries its token as a query param and notifications-service
 *       validates it itself).</li>
 *   <li>On every other route, requires a valid {@code Authorization: Bearer
 *       <jwt>} header. On failure, short-circuits with {@code 401}.</li>
 *   <li>On success, injects {@code X-User-Email}, {@code X-User-Type},
 *       {@code X-Agency-Id} headers (from the {@code sub}, {@code user_type},
 *       {@code agency_id} claims) before forwarding downstream.</li>
 *   <li>Additionally enforces {@code user_type=agency} on
 *       {@code /api/prospection/**}, per the routing table in §5.</li>
 * </ul>
 */
@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationFilter.class);

    /** Prefixes that never require JWT validation, matched with startsWith. */
    private static final List<String> PUBLIC_PREFIXES = List.of(
            // §5: whole auth.** namespace is public (login/otp/register).
            "/api/method/platform_core.platform_core.api.auth.",
            "/files/WhatsAppVideoDemo0.mp4",
            // Health checks must stay open (§10).
            "/actuator"
    );

    /**
     * Exact `allow_guest=True` Frappe methods listed in §5 "Routes Frappe
     * publiques" (outside of the auth.** namespace already covered above).
     */
    private static final Set<String> PUBLIC_EXACT_PATHS = Set.of(



            "/api/method/platform_core.platform_core.api.auth.request_otp",
            "/api/method/platform_core.platform_core.api.auth.verify_otp",
            "/api/method/platform_core.platform_core.api.auth.login",
            "/api/method/platform_core.platform_core.api.auth.register_client",
            "/api/method/platform_core.platform_core.api.auth.register_agency",
            "/api/method/platform_core.platform_core.api.agency.get_profile",
            "/api/method/platform_core.platform_core.api.agency.list_agencies",
            "/api/method/platform_core.platform_core.api.agency.track_website_click",
            // Used by the public agency registration form before a user has a JWT.
            "/api/method/platform_core.platform_core.api.agency.check_name_availability",
            "/api/method/platform_core.platform_core.api.search.search_agencies",
            "/api/method/platform_core.platform_core.api.search.search_natural_language",
            "/api/method/platform_core.platform_core.api.review.list_agency_reviews",
            "/api/method/platform_core.platform_core.api.utils.ping",
            "/api/method/platform_core.platform_core.api.utils.get_categories",
            "/api/method/platform_core.platform_core.api.utils.get_legal_id_rule",
            "/api/method/platform_core.platform_core.api.utils.validate_legal_id",

            //countries
            "/api/method/platform_core.platform_core.api.utils.get_countries",

            // §5: sole public exception under /api/ia/**.
            "/api/ia/chatbot/public",
            // §5 addendum: fired by anonymous visitors on public agency profile
            // pages (module 2.6 détection IP) — cannot require a JWT.
            "/api/prospection/track"
    );

    /** Socket.IO route: token travels as a query param, not a Bearer header (§5). */
    private static final String SOCKET_IO_PREFIX = "/socket.io";

    /** Routes that require an authenticated user_type=agency (§5). */
    private static final String PROSPECTION_PREFIX = "/api/prospection/";
    private static final String AGENCY_USER_TYPE = "agency";

    private final JwtUtil jwtUtil;

    public AuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getRawPath();

        if (isSocketIo(path) || isPublic(path)) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorized(exchange, "Missing or malformed Authorization header");
        }
        String token = authHeader.substring("Bearer ".length()).trim();

        JsonNode claims;
        try {
            claims = jwtUtil.parseAndValidate(token);
        } catch (JwtUtil.JwtValidationException e) {
            log.debug("JWT rejected for {} {}: {}", request.getMethod(), path, e.getMessage());
            return unauthorized(exchange, "Invalid or expired token");
        }

        String email = textOrNull(claims, JwtUtil.CLAIM_SUB);
        String userType = textOrNull(claims, JwtUtil.CLAIM_USER_TYPE);
        String agencyId = textOrNull(claims, JwtUtil.CLAIM_AGENCY_ID);

        if (path.startsWith(PROSPECTION_PREFIX) && !AGENCY_USER_TYPE.equals(userType)) {
            return forbidden(exchange, "This route requires user_type=agency");
        }

        ServerHttpRequest.Builder mutatedRequest = request.mutate()
                .header("X-User-Email", email == null ? "" : email)
                .header("X-User-Type", userType == null ? "" : userType);
        if (agencyId != null) {
            mutatedRequest.header("X-Agency-Id", agencyId);
        }

        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(mutatedRequest.build())
                .build();
        return chain.filter(mutatedExchange);
    }

    @Override
    public int getOrder() {
        // Run before Spring Cloud Gateway's routing/netty filters so the
        // mutated headers are visible to the proxied request.
        return -1;
    }

    private static boolean isSocketIo(String path) {
        return path != null && path.startsWith(SOCKET_IO_PREFIX);
    }

    private static boolean isPublic(String path) {
        if (path == null) {
            return false;
        }
        if (PUBLIC_EXACT_PATHS.contains(path)) {
            return true;
        }
        for (String prefix : PUBLIC_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private static String textOrNull(JsonNode claims, String field) {
        JsonNode node = claims.get(field);
        return (node == null || node.isNull()) ? null : node.asText();
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        return writeJsonError(exchange, HttpStatus.UNAUTHORIZED, message);
    }

    private Mono<Void> forbidden(ServerWebExchange exchange, String message) {
        return writeJsonError(exchange, HttpStatus.FORBIDDEN, message);
    }

    private Mono<Void> writeJsonError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"error\":\"" + status.getReasonPhrase() + "\",\"message\":\"" + escape(message) + "\"}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("\"", "'");
    }
}
