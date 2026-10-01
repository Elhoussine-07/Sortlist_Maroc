package com.platform.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Limitation de debit generale, par adresse IP, sur l'ensemble du trafic API.
 * Le compteur est maintenu dans Redis (et non en memoire locale du processus)
 * pour rester correct si la Gateway est repliquee sur plusieurs instances
 * derriere un repartiteur de charge -- voir chapitre 6 du rapport.
 *
 * S'applique avant AuthenticationFilter : une adresse abusive est bloquee
 * independamment du fait que la requete porte ou non un JWT valide.
 */
@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final String KEY_PREFIX = "ratelimit:gw:";

    private final ReactiveStringRedisTemplate redisTemplate;
    private final int maxRequests;
    private final Duration window;

    public RateLimitFilter(
            ReactiveStringRedisTemplate redisTemplate,
            @Value("${rate-limit.max-requests:100}") int maxRequests,
            @Value("${rate-limit.window-seconds:60}") long windowSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.maxRequests = maxRequests;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String ip = resolveClientIp(exchange.getRequest());
        String key = KEY_PREFIX + ip;

        return redisTemplate.opsForValue().increment(key)
                .flatMap(count -> {
                    Mono<Boolean> ensureExpiry = count == 1L
                            ? redisTemplate.expire(key, window)
                            : Mono.just(true);

                    return ensureExpiry.then(count > maxRequests
                            ? redisTemplate.getExpire(key).defaultIfEmpty(window)
                                    .flatMap(ttl -> tooManyRequests(exchange, ttl))
                            : chain.filter(exchange));
                })
                .onErrorResume(e -> {
                    // Redis indisponible : on degrade en laissant passer la requete
                    // plutot que de bloquer toute la plateforme sur une dependance
                    // non critique pour la disponibilite.
                    log.warn("Rate limiter: Redis unreachable, request allowed without counting ({})", e.getMessage());
                    return chain.filter(exchange);
                });
    }

    @Override
    public int getOrder() {
        return -2;
    }

    private Mono<Void> tooManyRequests(ServerWebExchange exchange, Duration retryAfter) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        long seconds = Math.max(retryAfter.getSeconds(), 1);
        response.getHeaders().add("Retry-After", String.valueOf(seconds));
        String body = "{\"error\":\"Too Many Requests\",\"message\":\"Limite de "
                + maxRequests + " requetes par " + window.getSeconds() + "s depassee.\"}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    private static String resolveClientIp(ServerHttpRequest request) {
        String forwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        InetSocketAddress remoteAddress = request.getRemoteAddress();
        return remoteAddress != null && remoteAddress.getAddress() != null
                ? remoteAddress.getAddress().getHostAddress()
                : "unknown";
    }
}
