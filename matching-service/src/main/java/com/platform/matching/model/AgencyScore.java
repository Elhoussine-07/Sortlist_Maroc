package com.platform.matching.model;

import java.util.List;
import java.util.Map;

public record AgencyScore(
        String agency,
        String agencyName,
        double matchingScore,
        double successPrediction,
        List<String> factors,
        Map<String, Double> scoreBreakdown
) {
}
