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
