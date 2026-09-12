package com.platform.matching.client;

import com.platform.matching.exception.FrappeIntegrationException;
import com.platform.matching.model.ProjectContext;
import com.platform.matching.model.ShortlistEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Component
public class FrappeClient {

    private static final Logger log = LoggerFactory.getLogger(FrappeClient.class);

    private static final String GET_PROJECT_CONTEXT_PATH =
            "/api/method/platform_core.platform_core.api.matching.get_project_context";
    private static final String SAVE_SHORTLIST_PATH =
            "/api/method/platform_core.platform_core.api.matching.save_shortlist";

    private final RestClient restClient;
    private final FrappeUrlResolver frappeUrlResolver;

    public FrappeClient(RestClient frappeRestClient, FrappeUrlResolver frappeUrlResolver) {
        this.restClient = frappeRestClient;
        this.frappeUrlResolver = frappeUrlResolver;
    }

    public ProjectContext getProjectContext(String projectId) {
        URI uri = UriComponentsBuilder
                .fromHttpUrl(frappeUrlResolver.resolve())
                .path(GET_PROJECT_CONTEXT_PATH)
                .queryParam("project", projectId)
                .build()
                .toUri();
        try {
            FrappeMessageEnvelope<ProjectContext> envelope = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(new ParameterizedTypeReference<FrappeMessageEnvelope<ProjectContext>>() {
                    });
            if (envelope == null || envelope.message() == null) {
                throw new FrappeIntegrationException(
                        "Reponse vide de get_project_context pour le projet " + projectId);
            }
            return envelope.message();
        } catch (RestClientException ex) {
            throw new FrappeIntegrationException(
                    "Echec de l'appel get_project_context pour le projet " + projectId, ex);
        }
    }

    public void saveShortlist(String projectId, List<ShortlistEntry> shortlist) {
        URI uri = UriComponentsBuilder
                .fromHttpUrl(frappeUrlResolver.resolve())
                .path(SAVE_SHORTLIST_PATH)
                .build()
                .toUri();
        Map<String, Object> body = Map.of(
                "project", projectId,
                "shortlist", shortlist
        );
        try {
            restClient.post()
                    .uri(uri)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Shortlist persistee cote Frappe pour le projet {} ({} agences)", projectId, shortlist.size());
        } catch (RestClientException ex) {
            throw new FrappeIntegrationException(
                    "Echec de l'appel save_shortlist pour le projet " + projectId, ex);
        }
    }
}
