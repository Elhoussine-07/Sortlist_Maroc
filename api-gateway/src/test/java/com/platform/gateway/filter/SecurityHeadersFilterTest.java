package com.platform.gateway.filter;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SecurityHeadersFilterTest {

    private final SecurityHeadersFilter filter = new SecurityHeadersFilter();
    private final GatewayFilterChain noopChain = exchange -> Mono.empty();

    @Test
    void addsNoSniffHeaderToResponse() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/matching/PRJ-1/shortlist"));

        filter.filter(exchange, noopChain).block();

        assertEquals("nosniff", exchange.getResponse().getHeaders().getFirst("X-Content-Type-Options"));
    }

    @Test
    void addsHstsHeaderToResponse() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/method/platform_core.platform_core.api.utils.ping"));

        filter.filter(exchange, noopChain).block();

        assertEquals("max-age=31536000; includeSubDomains",
                exchange.getResponse().getHeaders().getFirst("Strict-Transport-Security"));
    }
}
