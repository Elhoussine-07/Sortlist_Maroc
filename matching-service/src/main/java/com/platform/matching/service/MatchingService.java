package com.platform.matching.service;

import com.platform.matching.client.FrappeClient;
import com.platform.matching.config.MatchingProperties;
import com.platform.matching.model.AgencyScore;
import com.platform.matching.model.ProjectContext;
import com.platform.matching.model.ShortlistEntry;
import com.platform.matching.model.ShortlistResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Orchestre le cycle complet : lecture du contexte projet cote Frappe,
 * calcul des scores (ScoringService), puis persistance optionnelle de la
 * shortlist calculee (save_shortlist).
 */
@Service
public class MatchingService {

    private static final Logger log = LoggerFactory.getLogger(MatchingService.class);

    private final FrappeClient frappeClient;
    private final ScoringService scoringService;
    private final MatchingProperties matchingProperties;

    public MatchingService(FrappeClient frappeClient, ScoringService scoringService,
                            MatchingProperties matchingProperties) {
        this.frappeClient = frappeClient;
        this.scoringService = scoringService;
        this.matchingProperties = matchingProperties;
    }

    /**
     * Recalcule la shortlist d'un projet. Si {@code persist} est vrai, le
     * resultat est renvoye a Frappe via {@code save_shortlist} (persiste
     * dans {@code Project.shortlist_ia}) avant d'etre retourne a l'appelant.
     */
    public ShortlistResponse computeShortlist(String projectId, boolean persist) {
        ProjectContext context = frappeClient.getProjectContext(projectId);

        List<AgencyScore> ranked = scoringService.score(
                context.project(),
                context.clientTrustScoreOrZero(),
                context.candidateAgenciesOrEmpty(),
                matchingProperties.shortlistSize()
        );

        if (persist) {
            List<ShortlistEntry> entries = ranked.stream().map(ShortlistEntry::from).toList();
            frappeClient.saveShortlist(projectId, entries);
        } else {
            log.debug("Shortlist recalculee pour le projet {} sans persistance (GET)", projectId);
        }

        return new ShortlistResponse(projectId, persist, ranked);
    }
}
