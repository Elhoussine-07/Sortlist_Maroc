package com.platform.matching.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AgencyServiceDto(
        String serviceName,
        String skills,
        String techStack
) {
}
