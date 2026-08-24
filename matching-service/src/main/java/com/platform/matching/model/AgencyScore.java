package com.platform.matching.model;

import java.util.List;
import java.util.Map;

/**
 * Resultat de scoring pour une agence candidate sur un projet donne.
 *
 * @param agency            identifiant AgencyProfile (name Frappe)
 * @param agencyName        nom commercial, pour affichage direct sans round-trip
 * @param matchingScore     "scoring multicritere" (0-100), cf. ScoringService
 * @param successPrediction "score de compatibilite" / prediction de succes (0-100)
 * @param factors           facteurs explicatifs lisibles (transparence IA, cahier des charges 3.3)
 * @param scoreBreakdown    detail des sous-scores (0-100 chacun) ayant compose matchingScore,
 *                          par facteur : location, skills, budget, rating, pqi
 */
public record AgencyScore(
        String agency,
        String agencyName,
        double matchingScore,
        double successPrediction,
        List<String> factors,
        Map<String, Double> scoreBreakdown
) {
}
