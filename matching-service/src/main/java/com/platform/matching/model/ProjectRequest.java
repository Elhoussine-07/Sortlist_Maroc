package com.platform.matching.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectRequest(
        String name,
        String client,
        String title,
        String description,
        String category,
        String subCategory,
        Double budgetMin,
        Double budgetMax,
        Integer deliveryDelayDays,
        String location
) {
}
