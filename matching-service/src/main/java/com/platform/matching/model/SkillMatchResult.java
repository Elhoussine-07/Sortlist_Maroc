package com.platform.matching.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SkillMatchResult(
        Double score,
        String provider,
        String matchedService
) {
}
