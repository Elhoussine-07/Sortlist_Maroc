package com.platform.matching.model;

/**
 * Forme exacte attendue par {@code POST .../matching.save_shortlist}
 * (cf. docs/INTEGRATION.md §6) : {@code {agency, score, success_prediction}}.
 * Volontairement plus etroite que {@link AgencyScore} pour ne persister cote
 * Frappe que ce que le contrat definit.
 */
public record ShortlistEntry(String agency, double score, double successPrediction) {

    public static ShortlistEntry from(AgencyScore score) {
        return new ShortlistEntry(score.agency(), score.matchingScore(), score.successPrediction());
    }
}
