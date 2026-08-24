package com.platform.gateway.filter;

import com.platform.gateway.config.FrappeUrlResolver;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.RouteToRequestUrlFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;

/**
 * Rewrites the resolved target URI of the {@code "frappe"} route (declared
 * in {@link com.platform.gateway.config.GatewayConfig}) at request time, so
 * that traffic to Frappe follows the same container/local automatic
 * fallback as the other three Frappe clients in this monorepo (cf.
 * {@code docs/FRAPPE_FALLBACK.md} and
 * {@code matching-service/.../FrappeUrlResolver.java}).
 *
 * <h2>Why a static route URI isn't enough</h2>
 * Spring Cloud Gateway's usual {@code RouteLocatorBuilder.routes().route(...
 * .uri(someFixedUri))} resolves that URI exactly once, when the
 * {@code RouteLocator} bean is built at startup (or on a refresh event) —
 * it is not re-evaluated per request. A {@code Function}/{@code Supplier}
 * cannot be plugged into {@code .uri(...)} either: that builder only accepts
 * a concrete {@link URI}/{@link String}. Two standard ways to get "route
 * target chosen per request" out of Spring Cloud Gateway are (a) a
 * {@code lb://} URI backed by a custom {@code ReactorLoadBalancer} client,
 * which pulls in spring-cloud-loadbalancer for what is really a two-way
 * choice, or (b) a {@link GlobalFilter} that overrides the resolved target
 * URI for matching requests. This class takes route (b): far less
 * machinery for exactly the "probe A, else B, cache briefly" behaviour we
 * need, and it stays a plain filter — no service registry, no load
 * balancer abstraction.
 *
 * <h2>How it works</h2>
 * {@link RouteToRequestUrlFilter} (Spring Cloud Gateway, order
 * {@value org.springframework.cloud.gateway.filter.RouteToRequestUrlFilter#ROUTE_TO_URL_FILTER_ORDER})
 * merges the matched route's static URI (scheme/host/port) with the
 * incoming request's path/query and stores the result in the
 * {@code GATEWAY_REQUEST_URL_ATTR} exchange attribute, which the routing
 * filters (e.g. {@code NettyRoutingFilter}) further downstream actually
 * connect to. This filter runs immediately *after*
 * {@code RouteToRequestUrlFilter} (order + 1) and, only for the
 * {@code "frappe"} route, replaces that attribute's scheme/host/port with
 * whatever {@link FrappeUrlResolver} currently resolves to — keeping the
 * already-merged path and query string untouched. The route's own
 * {@code .uri(...)} in {@code GatewayConfig} therefore only needs to be a
 * syntactically valid placeholder (it is never actually connected to for
 * real traffic); see the comment there.
 */
@Component
public class FrappeDynamicRoutingFilter implements GlobalFilter, Ordered {

    private static final String FRAPPE_ROUTE_ID = "frappe";

    private final FrappeUrlResolver frappeUrlResolver;

    public FrappeDynamicRoutingFilter(FrappeUrlResolver frappeUrlResolver) {
        this.frappeUrlResolver = frappeUrlResolver;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        if (route == null || !FRAPPE_ROUTE_ID.equals(route.getId())) {
            return chain.filter(exchange);
        }

        URI requestUrl = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);
        if (requestUrl == null) {
            // RouteToRequestUrlFilter hasn't run yet / didn't set it — nothing to rewrite.
            return chain.filter(exchange);
        }

        return frappeUrlResolver.resolve().flatMap(base -> {
            URI dynamicBase = URI.create(base);
            boolean encoded = ServerWebExchangeUtils.containsEncodedParts(requestUrl);
            URI rewritten = UriComponentsBuilder.fromUri(requestUrl)
                    .scheme(dynamicBase.getScheme())
                    .host(dynamicBase.getHost())
                    .port(dynamicBase.getPort())
                    .build(encoded)
                    .toUri();
            exchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR, rewritten);
            return chain.filter(exchange);
        });
    }

    @Override
    public int getOrder() {
        return RouteToRequestUrlFilter.ROUTE_TO_URL_FILTER_ORDER + 1;
    }
}
