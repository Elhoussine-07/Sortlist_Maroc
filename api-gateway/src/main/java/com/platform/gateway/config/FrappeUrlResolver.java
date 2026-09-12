package com.platform.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class FrappeUrlResolver {

    private static final Logger log = LoggerFactory.getLogger(FrappeUrlResolver.class);

    private static final String PROBE_PATH = "/api/method/platform_core.platform_core.api.utils.ping";
    private static final Duration PROBE_TIMEOUT = Duration.ofMillis(1500);
    private static final Duration CACHE_TTL = Duration.ofSeconds(45);

    private final String explicitUrl;
    private final String containerUrl;
    private final String localUrl;
    private final WebClient probeClient;

    private final AtomicReference<String> lastGood = new AtomicReference<>();

    private final Mono<String> cachedResolution;

    public FrappeUrlResolver(
            @Value("${services.frappe-url:}") String explicitUrl,
            @Value("${services.frappe-url-container:http://frappe:8000}") String containerUrl,
            @Value("${services.frappe-url-local:http://host.docker.internal:8000}") String localUrl) {
        this.explicitUrl = blankToNull(explicitUrl);
        this.containerUrl = stripTrailingSlash(containerUrl);
        this.localUrl = stripTrailingSlash(localUrl);
        this.probeClient = WebClient.builder().build();
        this.cachedResolution = buildResolutionMono().cache(CACHE_TTL);

        if (this.explicitUrl != null) {
            log.info("FRAPPE_URL explicitly set ({}) - automatic container/local fallback disabled", this.explicitUrl);
        } else {
            log.info("Automatic Frappe fallback enabled: container={}, local={}", this.containerUrl, this.localUrl);
        }
    }

    public Mono<String> resolve() {
        if (explicitUrl != null) {
            return Mono.just(explicitUrl);
        }
        return cachedResolution;
    }

    private Mono<String> buildResolutionMono() {
        return probe(containerUrl).flatMap(containerOk -> {
            if (containerOk) {
                lastGood.set(containerUrl);
                return Mono.just(containerUrl);
            }
            return probe(localUrl).map(localOk -> {
                if (localOk) {
                    lastGood.set(localUrl);
                    return localUrl;
                }
                String fallback = lastGood.get();
                log.warn("Frappe unreachable on both container ({}) and local ({}) URLs - "
                        + "reusing last known-good URL if any", containerUrl, localUrl);
                return fallback != null ? fallback : containerUrl;
            });
        });
    }

    private Mono<Boolean> probe(String baseUrl) {
        return probeClient.get()
                .uri(baseUrl + PROBE_PATH)
                .exchangeToMono(response -> Mono.just(response.statusCode().value() < 500))
                .timeout(PROBE_TIMEOUT)
                .onErrorReturn(false);
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : stripTrailingSlash(value.trim());
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
