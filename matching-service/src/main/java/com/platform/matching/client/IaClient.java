package com.platform.matching.client;

import com.platform.matching.config.IaProperties;
import com.platform.matching.model.CandidateAgency;
import com.platform.matching.model.SkillMatchCandidateInput;
import com.platform.matching.model.SkillMatchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Appelle ia-service pour obtenir un score de compétences base sur le sens du texte
 * (similarite d'embeddings) plutot que sur la simple correspondance de mots-cles.
 * Best-effort : toute erreur (ia-service injoignable, non configure, etc.) est
 * avalee et journalisee -- le calcul de shortlist ne doit jamais echouer a cause
 * de cet enrichissement, il retombe simplement sur le score de mots-cles seul.
 */
@Component
public class IaClient {

    private static final Logger log = LoggerFactory.getLogger(IaClient.class);

    private static final String SKILL_SCORES_PATH = "/api/ia/matching/skill-scores";

    private final RestClient restClient;
    private final IaProperties iaProperties;

    public IaClient(RestClient iaRestClient, IaProperties iaProperties) {
        this.restClient = iaRestClient;
        this.iaProperties = iaProperties;
    }

    public Map<String, Double> scoreSkillMatches(String needText, List<CandidateAgency> candidates) {
        if (needText == null || needText.isBlank() || candidates.isEmpty()) {
            return Map.of();
        }

        List<SkillMatchCandidateInput> payloadCandidates = candidates.stream()
                .map(c -> new SkillMatchCandidateInput(c.name(), c.servicesOrEmpty()))
                .toList();

        URI uri = UriComponentsBuilder.fromHttpUrl(iaProperties.url())
                .path(SKILL_SCORES_PATH)
                .build()
                .toUri();
        Map<String, Object> body = Map.of("need_text", needText, "candidates", payloadCandidates);

        try {
            SkillMatchResponse response = restClient.post()
                    .uri(uri)
                    .body(body)
                    .retrieve()
                    .body(SkillMatchResponse.class);

            if (response == null || response.scores() == null) {
                return Map.of();
            }
            return response.scores().entrySet().stream()
                    .filter(e -> e.getValue() != null && e.getValue().score() != null)
                    .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().score()));
        } catch (RestClientException ex) {
            log.warn("ia-service injoignable pour le score semantique de competences, "
                    + "repli sur la correspondance de mots-cles uniquement: {}", ex.getMessage());
            return Map.of();
        }
    }
}
