package com.platform.matching.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Sous-ensemble du DocType Frappe {@code Project} utile au scoring
 * (cf. docs/INTEGRATION.md §6 et platform_core/doctype/project/project.json).
 * Le payload complet renvoye par {@code get_project_context} contient bien
 * d'autres champs (statut, cdc_file, ...) ; ils sont ignores ici.
 */
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
