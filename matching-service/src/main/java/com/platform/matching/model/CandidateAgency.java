package com.platform.matching.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Agence candidate telle que renvoyee par
 * {@code platform_core.api.matching.get_project_context} (champ
 * {@code candidate_agencies}). {@code remoteWork} arrive en 0/1 (DocType
 * "Check" cote Frappe), d'ou {@link #isRemoteWork()}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CandidateAgency(
        String name,
        String agencyName,
        String location,
        String coverage,
        Integer remoteWork,
        Double rating,
        Integer pqiScore,
        Integer teamSize,
        Integer yearFounded,
        Double annualRevenue,
        List<AgencyServiceDto> services,
        Integer completedProjects
) {
    public boolean isRemoteWork() {
        return remoteWork != null && remoteWork != 0;
    }

    public int completedProjectsOrZero() {
        return completedProjects != null ? completedProjects : 0;
    }

    public List<AgencyServiceDto> servicesOrEmpty() {
        return services != null ? services : List.of();
    }
}
