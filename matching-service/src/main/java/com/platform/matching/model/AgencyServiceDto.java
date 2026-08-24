package com.platform.matching.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Ligne de la table enfant AgencyService (prestations proposees par une agence). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AgencyServiceDto(
        String serviceName,
        String skills,
        String techStack
) {
}
