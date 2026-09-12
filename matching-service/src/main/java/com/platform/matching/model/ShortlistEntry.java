package com.platform.matching.model;

public record ShortlistEntry(String agency, double score, double successPrediction) {

    public static ShortlistEntry from(AgencyScore score) {
        return new ShortlistEntry(score.agency(), score.matchingScore(), score.successPrediction());
    }
}
