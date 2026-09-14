package com.platform.matching.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SkillMatchResponse(
        Map<String, SkillMatchResult> scores
) {
}
