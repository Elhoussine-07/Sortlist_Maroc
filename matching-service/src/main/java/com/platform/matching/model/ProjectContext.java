package com.platform.matching.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Reponse de {@code GET .../matching.get_project_context}
 * (cf. docs/INTEGRATION.md §6).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectContext(
        ProjectRequest project,
        Double clientTrustScore,
        List<CandidateAgency> candidateAgencies
) {
    public double clientTrustScoreOrZero() {
        return clientTrustScore != null ? clientTrustScore : 0.0;
    }

    public List<CandidateAgency> candidateAgenciesOrEmpty() {
        return candidateAgencies != null ? candidateAgencies : List.of();
    }
}
