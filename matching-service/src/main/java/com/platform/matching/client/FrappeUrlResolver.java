package com.platform.matching.client;

import com.platform.matching.config.FrappeProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Resout dynamiquement l'URL de base a utiliser pour joindre Frappe, sans
 * jamais coder en dur "Frappe est en local" ou "en conteneur"
 * (cf. {@code docs/FRAPPE_FALLBACK.md}).
 *
 * <p>Strategie : essaie d'abord l'URL "conteneur" ({@code FRAPPE_URL_CONTAINER},
 * par defaut {@code http://frappe:8000}) via une sonde HTTP courte sur
 * {@code /api/method/platform_core.platform_core.api.utils.ping} (methode
 * publique {@code allow_guest=True}, cf. docs/INTEGRATION.md §5). Si la sonde
 * echoue (connexion refusee, timeout, DNS introuvable), bascule sur l'URL
 * "locale" ({@code FRAPPE_URL_LOCAL}, par defaut
 * {@code http://host.docker.internal:8000}).
 *
 * <p>Le dernier choix qui a fonctionne est mis en cache {@link #CACHE_TTL}
 * pour eviter de sonder Frappe a chaque appel, puis expire et est re-teste -
 * si Frappe bascule de local vers conteneur (ou l'inverse) en cours de route,
 * ce service s'en apercoit au plus tard {@link #CACHE_TTL} plus tard.
 *
 * <p>Si {@code FRAPPE_URL} est explicitement definie, elle prend le pas sur
 * tout : aucune sonde n'est effectuee, la bascule automatique est
 * desactivee (utile pour forcer une valeur en debug).
 */
@Component
public class FrappeUrlResolver {

    private static final Logger log = LoggerFactory.getLogger(FrappeUrlResolver.class);

    private static final String PROBE_PATH = "/api/method/platform_core.platform_core.api.utils.ping";
    private static final Duration PROBE_TIMEOUT = Duration.ofMillis(1500);
    private static final Duration CACHE_TTL = Duration.ofSeconds(45);

    private final String explicitUrl;
    private final String containerUrl;
    private final String localUrl;
    private final HttpClient probeClient;

    private final AtomicReference<CachedUrl> cache = new AtomicReference<>();

    public FrappeUrlResolver(FrappeProperties properties) {
        this.explicitUrl = blankToNull(properties.url());
        this.containerUrl = stripTrailingSlash(orDefault(properties.urlContainer(), "http://frappe:8000"));
        this.localUrl = stripTrailingSlash(orDefault(properties.urlLocal(), "http://host.docker.internal:8000"));
        this.probeClient = HttpClient.newBuilder()
                .connectTimeout(PROBE_TIMEOUT)
                .build();

        if (explicitUrl != null) {
            log.info("FRAPPE_URL explicitement definie ({}) - bascule automatique desactivee", explicitUrl);
        } else {
            log.info("Bascule Frappe automatique activee: conteneur={}, local={}", containerUrl, localUrl);
        }
    }

    /** Retourne l'URL de base a utiliser *maintenant* pour joindre Frappe (sans slash final). */
    public String resolve() {
        if (explicitUrl != null) {
            return explicitUrl;
        }

        CachedUrl cached = cache.get();
        if (cached != null && cached.isFresh()) {
            return cached.url();
        }
        return probeAndCache();
    }

    private synchronized String probeAndCache() {
        // Un autre thread a peut-etre deja rafraichi le cache pendant qu'on
        // attendait le verrou.
        CachedUrl cached = cache.get();
        if (cached != null && cached.isFresh()) {
            return cached.url();
        }

        if (probe(containerUrl)) {
            cache.set(new CachedUrl(containerUrl, Instant.now()));
            return containerUrl;
        }
        if (probe(localUrl)) {
            cache.set(new CachedUrl(localUrl, Instant.now()));
            return localUrl;
        }

        log.warn("Frappe injoignable sur l'URL conteneur ({}) et l'URL locale ({}) - "
                + "reutilisation du dernier choix connu si disponible", containerUrl, localUrl);
        // On ne remet pas le cache a jour (il reste donc perime) afin que le
        // prochain appel retente immediatement une sonde.
        return cached != null ? cached.url() : containerUrl;
    }

    private boolean probe(String baseUrl) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + PROBE_PATH))
                    .timeout(PROBE_TIMEOUT)
                    .GET()
                    .build();
            HttpResponse<Void> response = probeClient.send(request, HttpResponse.BodyHandlers.discarding());
            // Une reponse (meme 4xx) prouve que quelque chose repond bien a
            // cette adresse ; seule une erreur reseau (5xx cote proxy absent,
            // connexion refusee, DNS...) doit etre traitee comme "indisponible".
            return response.statusCode() < 500;
        } catch (IOException e) {
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : stripTrailingSlash(value.trim());
    }

    private static String orDefault(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value.trim();
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private record CachedUrl(String url, Instant resolvedAt) {
        boolean isFresh() {
            return Duration.between(resolvedAt, Instant.now()).compareTo(CACHE_TTL) < 0;
        }
    }
}
