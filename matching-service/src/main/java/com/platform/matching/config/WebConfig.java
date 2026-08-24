package com.platform.matching.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Client HTTP interne vers Frappe. Le jeton de service (X-Internal-Token,
 * cf. docs/INTEGRATION.md §4) est pose une fois pour toutes ici : les appels
 * sortants du matching-service n'ont donc jamais besoin de le repasser
 * manuellement.
 *
 * <p>Pas de {@code baseUrl(...)} ici : Frappe peut tourner en conteneur ou en
 * local et cette decision peut changer en cours de route (cf.
 * {@code docs/FRAPPE_FALLBACK.md}), donc l'URL de base est resolue a chaque
 * appel par {@code FrappeUrlResolver} et passee en URI absolue directement
 * dans {@code FrappeClient}.
 */
@Configuration
public class WebConfig {

    @Bean
    public RestClient frappeRestClient(RestClient.Builder restClientBuilder, FrappeProperties frappeProperties) {
        // Le RestClient.Builder injecte est celui auto-configure par Spring
        // Boot : il reutilise donc le meme ObjectMapper (Jackson) que le
        // reste de l'application, notamment la strategie SNAKE_CASE
        // (application.yml) necessaire pour parler avec Frappe.
        return restClientBuilder
                .defaultHeader("X-Internal-Token", frappeProperties.internalToken())
                .build();
    }
}
