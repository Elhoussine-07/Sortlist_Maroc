package com.platform.matching.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration d'acces au backend Frappe (source de verite metier).
 *
 * <p>Deux modes possibles (cf. {@code docs/FRAPPE_FALLBACK.md}) :
 * <ul>
 *   <li><b>Bascule automatique (par defaut)</b> : {@code url} est absent/vide,
 *       {@link com.platform.matching.client.FrappeUrlResolver} essaie
 *       {@code urlContainer} puis, en cas d'echec, {@code urlLocal}.</li>
 *   <li><b>Override explicite (debug)</b> : {@code url} (variable d'env
 *       {@code FRAPPE_URL}) est renseignee -> elle est utilisee telle quelle,
 *       sans aucune sonde ni bascule.</li>
 * </ul>
 */
@ConfigurationProperties(prefix = "frappe")
public record FrappeProperties(String url, String urlContainer, String urlLocal, String internalToken) {
}
