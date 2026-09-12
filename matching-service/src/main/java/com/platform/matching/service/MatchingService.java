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
