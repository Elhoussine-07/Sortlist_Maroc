package com.platform.matching.service;

import com.platform.matching.client.FrappeClient;
import com.platform.matching.client.IaClient;
import com.platform.matching.config.MatchingProperties;
import com.platform.matching.model.AgencyScore;
import com.platform.matching.model.ProjectContext;
import com.platform.matching.model.ProjectRequest;
import com.platform.matching.model.ShortlistEntry;
import com.platform.matching.model.ShortlistResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MatchingService {

    private static final Logger log = LoggerFactory.getLogger(MatchingService.class);

    private final FrappeClient frappeClient;
    private final IaClient iaClient;
    private final ScoringService scoringService;
    private final MatchingProperties matchingProperties;

    public MatchingService(FrappeClient frappeClient, IaClient iaClient, ScoringService scoringService,
                            MatchingProperties matchingProperties) {
        this.frappeClient = frappeClient;
        this.iaClient = iaClient;
        this.scoringService = scoringService;
        this.matchingProperties = matchingProperties;
    }

    public ShortlistResponse computeShortlist(String projectId, boolean persist) {
        ProjectContext context = frappeClient.getProjectContext(projectId);
        ProjectRequest project = context.project();

        Map<String, Double> semanticSkillScores = iaClient.scoreSkillMatches(
                needText(project), context.candidateAgenciesOrEmpty());

        List<AgencyScore> ranked = scoringService.score(
                project,
                context.clientTrustScoreOrZero(),
                context.candidateAgenciesOrEmpty(),
                matchingProperties.shortlistSize(),
                semanticSkillScores
        );

        if (persist) {
            List<ShortlistEntry> entries = ranked.stream().map(ShortlistEntry::from).toList();
            frappeClient.saveShortlist(projectId, entries);
        } else {
            log.debug("Shortlist recalculee pour le projet {} sans persistance (GET)", projectId);
        }

        return new ShortlistResponse(projectId, persist, ranked);
    }

    private static String needText(ProjectRequest project) {
        StringBuilder sb = new StringBuilder();
        appendIfPresent(sb, project.category());
        appendIfPresent(sb, project.subCategory());
        appendIfPresent(sb, project.description());
        return sb.toString().trim();
    }

    private static void appendIfPresent(StringBuilder sb, String value) {
        if (value != null && !value.isBlank()) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(value.trim());
        }
    }
}
