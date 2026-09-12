package com.platform.matching.service;

import com.platform.matching.model.AgencyScore;
import com.platform.matching.model.AgencyServiceDto;
import com.platform.matching.model.CandidateAgency;
import com.platform.matching.model.ProjectRequest;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Year;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ScoringService {

    public static final double LOCATION_WEIGHT = 0.15;
    public static final double SKILLS_WEIGHT = 0.35;
    public static final double BUDGET_WEIGHT = 0.15;
    public static final double RATING_WEIGHT = 0.15;
    public static final double PQI_WEIGHT = 0.20;

    private static final double NEUTRAL_SCORE = 50.0;

    private static final double EXPERIENCE_WEIGHT = 0.5;
    private static final double SP_RATING_WEIGHT = 0.3;
    private static final double CLIENT_TRUST_WEIGHT = 0.2;

    private static final double EXPERIENCE_SATURATION_PROJECTS = 10.0;

    private static final double COMFORTABLE_REVENUE_RATIO = 5.0;

    private static final Set<String> STOPWORDS = Set.of(
            "de", "des", "du", "la", "le", "les", "un", "une", "et", "en",
            "pour", "avec", "dans", "sur", "au", "aux", "a", "ou", "que",
            "qui", "ce", "cette", "ces", "nos", "notre", "votre", "vos",
            "the", "and", "for", "with", "of", "to", "an"
    );

    public List<AgencyScore> score(ProjectRequest project, double clientTrustScore,
                                   List<CandidateAgency> candidates, int limit) {
        return candidates.stream()
                .map(candidate -> scoreCandidate(project, clientTrustScore, candidate))
                .sorted(Comparator.comparingDouble(AgencyScore::matchingScore).reversed())
                .limit(Math.max(limit, 0))
                .collect(Collectors.toList());
    }

    private AgencyScore scoreCandidate(ProjectRequest project, double clientTrustScore, CandidateAgency agency) {
        double locationScore = scoreLocation(project, agency);
        double skillsScore = scoreSkills(project, agency);
        double budgetScore = scoreBudgetFit(project, agency);
        double ratingScore = scoreRating(agency);
        double pqiScore = scorePqi(agency);

        double matchingScore = round1(
                locationScore * LOCATION_WEIGHT
                        + skillsScore * SKILLS_WEIGHT
                        + budgetScore * BUDGET_WEIGHT
                        + ratingScore * RATING_WEIGHT
                        + pqiScore * PQI_WEIGHT
        );

        Map<String, Double> breakdown = new LinkedHashMap<>();
        breakdown.put("location", round1(locationScore));
        breakdown.put("skills", round1(skillsScore));
        breakdown.put("budget", round1(budgetScore));
        breakdown.put("rating", round1(ratingScore));
        breakdown.put("pqi", round1(pqiScore));

        double successPrediction = computeSuccessPrediction(agency, clientTrustScore, ratingScore);
        List<String> factors = explainSuccessPrediction(agency, clientTrustScore);

        return new AgencyScore(
                agency.name(),
                agency.agencyName(),
                clamp(matchingScore),
                clamp(round1(successPrediction)),
                factors,
                breakdown
        );
    }

    private double scoreLocation(ProjectRequest project, CandidateAgency agency) {
        if (agency.isRemoteWork()) {
            return 100.0;
        }
        String projectLocation = normalize(project.location());
        if (projectLocation.isBlank()) {
            return NEUTRAL_SCORE;
        }
        String agencyLocation = normalize(agency.location());
        String coverage = normalize(agency.coverage());
        if (agencyLocation.isBlank() && coverage.isBlank()) {
            return NEUTRAL_SCORE;
        }
        if (!agencyLocation.isBlank() && (agencyLocation.contains(projectLocation) || projectLocation.contains(agencyLocation))) {
            return 100.0;
        }
        if (!coverage.isBlank() && tokenize(coverage).stream().anyMatch(t -> projectLocation.contains(t) || t.contains(projectLocation))) {
            return 100.0;
        }
        return 20.0;
    }

    private double scoreSkills(ProjectRequest project, CandidateAgency agency) {
        Set<String> coreTokens = tokenize(join(project.category(), project.subCategory()));
        Set<String> extraTokens = tokenize(project.description());

        Set<String> agencyTokens = agency.servicesOrEmpty().stream()
                .flatMap(s -> tokenize(join(s.serviceName(), s.skills(), s.techStack())).stream())
                .collect(Collectors.toSet());

        if (agencyTokens.isEmpty() || (coreTokens.isEmpty() && extraTokens.isEmpty())) {
            return NEUTRAL_SCORE;
        }

        double coreOverlap = coreTokens.isEmpty() ? -1 : jaccard(coreTokens, agencyTokens) * 100;
        double extraOverlap = extraTokens.isEmpty() ? -1 : jaccard(extraTokens, agencyTokens) * 100;

        if (coreOverlap >= 0 && extraOverlap >= 0) {
            return coreOverlap * 0.7 + extraOverlap * 0.3;
        }
        return coreOverlap >= 0 ? coreOverlap : extraOverlap;
    }

    private double scoreBudgetFit(ProjectRequest project, CandidateAgency agency) {
        Double budgetMax = project.budgetMax();
        Double revenue = agency.annualRevenue();
        if (budgetMax == null || budgetMax <= 0 || revenue == null || revenue <= 0) {
            return NEUTRAL_SCORE;
        }
        double ratio = revenue / budgetMax;
        if (ratio >= COMFORTABLE_REVENUE_RATIO) {
            return 100.0;
        }
        if (ratio >= 1.0) {
            return 60.0 + (ratio - 1.0) / (COMFORTABLE_REVENUE_RATIO - 1.0) * 40.0;
        }
        return 20.0 + ratio * 40.0;
    }

    private double scoreRating(CandidateAgency agency) {
        if (agency.rating() == null) {
            return NEUTRAL_SCORE;
        }
        return clamp(agency.rating() / 5.0 * 100.0);
    }

    private double scorePqi(CandidateAgency agency) {
        if (agency.pqiScore() == null) {
            return NEUTRAL_SCORE;
        }
        return clamp(agency.pqiScore());
    }

    private double computeSuccessPrediction(CandidateAgency agency, double clientTrustScore, double ratingScore) {
        double experienceScore = Math.min(
                agency.completedProjectsOrZero() / EXPERIENCE_SATURATION_PROJECTS, 1.0) * 100.0;
        double trustScore = clamp(clientTrustScore);
        return experienceScore * EXPERIENCE_WEIGHT
                + ratingScore * SP_RATING_WEIGHT
                + trustScore * CLIENT_TRUST_WEIGHT;
    }

    private List<String> explainSuccessPrediction(CandidateAgency agency, double clientTrustScore) {
        List<String> factors = new ArrayList<>();

        int completed = agency.completedProjectsOrZero();
        if (completed > 0) {
            factors.add(completed + " projet" + (completed > 1 ? "s" : "") + " similaire"
                    + (completed > 1 ? "s" : "") + " termine" + (completed > 1 ? "s" : "")
                    + " avec succes sur la plateforme");
        } else {
            factors.add("Aucun projet termine recense pour cette agence sur la plateforme");
        }

        if (agency.rating() != null) {
            factors.add(String.format(Locale.FRANCE, "Note moyenne de %.1f/5 sur les avis clients", agency.rating()));
        } else {
            factors.add("Pas encore de note moyenne disponible");
        }

        factors.add(String.format(Locale.FRANCE, "Score de confiance du client de %.0f/100", clientTrustScore));

        if (agency.yearFounded() != null && agency.yearFounded() > 0) {
            int age = Year.now().getValue() - agency.yearFounded();
            if (age > 0) {
                factors.add(age + " an" + (age > 1 ? "s" : "") + " d'existence (agence fondee en " + agency.yearFounded() + ")");
            }
        }

        return factors;
    }

    private static String join(String... parts) {
        return Arrays.stream(parts)
                .filter(p -> p != null && !p.isBlank())
                .collect(Collectors.joining(" "));
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String noAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return noAccents.toLowerCase(Locale.FRANCE).trim();
    }

    private static Set<String> tokenize(String value) {
        String normalized = normalize(value);
        if (normalized.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(normalized.split("[^a-z0-9]+"))
                .filter(t -> t.length() > 2 && !STOPWORDS.contains(t))
                .collect(Collectors.toSet());
    }

    private static double jaccard(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) {
            return 0.0;
        }
        long intersection = a.stream().filter(b::contains).count();
        int unionSize = a.size() + b.size() - (int) intersection;
        return unionSize == 0 ? 0.0 : (double) intersection / unionSize;
    }

    private static double clamp(double value) {
        return Math.max(0.0, Math.min(100.0, value));
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
