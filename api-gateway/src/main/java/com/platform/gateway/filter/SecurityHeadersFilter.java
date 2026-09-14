package com.platform.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Ajoute des en-tetes de securite HTTP sur toute reponse de la Gateway.
 * Limite volontairement a ce qui a un sens pour une reponse d'API (JSON) :
 * la Gateway ne sert jamais de HTML elle-meme (le front-end est un
 * service separe), donc X-Frame-Options et Content-Security-Policy --
 * qui protegent le rendu d'une page -- n'ont pas leur place ici et
 * doivent etre portes par ce qui sert reellement le HTML.
 */
@Component
public class SecurityHeadersFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        HttpHeaders headers = exchange.getResponse().getHeaders();
        headers.add("X-Content-Type-Options", "nosniff");
        headers.add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
