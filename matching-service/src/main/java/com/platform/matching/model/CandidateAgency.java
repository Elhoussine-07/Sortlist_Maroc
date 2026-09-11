package com.platform.matching.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

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
