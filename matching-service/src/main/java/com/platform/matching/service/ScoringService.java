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

/**
 * Moteur de scoring multicritere (cahier des charges 3.2 "Moteur de
 * recommandation IA avance" / 3.3 "Prediction des chances de succes").
 *
 * <p>Deux scores independants sont calcules par agence candidate :
 * <ul>
 *   <li>{@code matching_score} (0-100) : pondere expertise/skills, budget,
 *       localisation, avis et disponibilite (proxy PQI) — cf. cahier §3.2
 *       "Scoring multicritere : Ponderation dynamique de l'expertise, du
 *       budget, de la localisation, des avis et de la disponibilite".</li>
 *   <li>{@code success_prediction} (0-100) : "Probabilite de collaboration
 *       reussie calculee a partir de projets historiques comparables"
 *       (cahier §3.3), accompagnee de "facteurs explicatifs" (transparence
 *       de l'IA).</li>
 * </ul>
 *
 * Les poids sont des constantes nommees, volontairement modestes en nombre,
 * pour rester faciles a re-calibrer plus tard (apprentissage continu —
 * cahier §3.2, hors perimetre de cette iteration).
 */
@Service
public class ScoringService {

    // ------------------------------------------------------------------
    // Ponderation du matching_score (somme = 1.0)
    // PONDERATION AJUSTEE (25/08) : rééquilibrage suite a analyse des
    // incoherences internes du systeme de scoring. Details :
    //   - PQI releve 0.15 -> 0.20 : c'est une metrique propriete de la
    //     plateforme, deja auditee (PQICriterion), plus fiable que Location.
    //   - LOCATION baissee 0.20 -> 0.15 : score deja "court-circuite" a 100
    //     des qu'une agence est en remote_work, ce qui reduit son pouvoir
    //     discriminant pour une part croissante d'agences.
    //   - RATING baissee 0.20 -> 0.15 : deja pris en compte a 30% dans le
    //     success_prediction (SP_RATING_WEIGHT) ; le laisser a 20% ici
    //     revenait a compter deux fois le meme signal de qualite.
    //   - BUDGET relevee 0.10 -> 0.15 : la capacite financiere reste un
    //     risque business reel, meme via un proxy imparfait (CA annuel).
    //   - SKILLS inchangee a 0.35 : reste le critere central du matching.
    // Somme = 1.0 (35+20+15+15+15).
    // ------------------------------------------------------------------
    public static final double LOCATION_WEIGHT = 0.15;
    public static final double SKILLS_WEIGHT = 0.35;
    public static final double BUDGET_WEIGHT = 0.15;
    public static final double RATING_WEIGHT = 0.15;
    public static final double PQI_WEIGHT = 0.20;

    // Score neutre utilise quand une donnee necessaire au calcul d'un
    // facteur est absente (evite de penalizer/avantager injustement une
    // agence pour un manque de donnee plutot qu'un vrai mismatch).
    private static final double NEUTRAL_SCORE = 50.0;

    // ------------------------------------------------------------------
    // Ponderation du success_prediction (somme = 1.0)
    // ------------------------------------------------------------------
    private static final double EXPERIENCE_WEIGHT = 0.5;
    private static final double SP_RATING_WEIGHT = 0.3;
    private static final double CLIENT_TRUST_WEIGHT = 0.2;

    // Nombre de projets termines a partir duquel le facteur "experience"
    // sature a 100 (au-dela, un projet de plus ne differencie plus).
    private static final double EXPERIENCE_SATURATION_PROJECTS = 10.0;

    // Ratio chiffre d'affaires annuel / budget projet a partir duquel on
    // considere l'agence en pleine capacite financiere pour ce projet.
    private static final double COMFORTABLE_REVENUE_RATIO = 5.0;

    // CORRECTIF : "a" apparaissait deux fois (liste FR "a"/"à" + liste EN
    // "a" article indefini), ce qui faisait planter Set.of() au chargement
    // de la classe (IllegalArgumentException: duplicate element: a).
    // Le doublon a ete retire, "a" couvre deja les deux usages.
    private static final Set<String> STOPWORDS = Set.of(
            "de", "des", "du", "la", "le", "les", "un", "une", "et", "en",
            "pour", "avec", "dans", "sur", "au", "aux", "a", "ou", "que",
            "qui", "ce", "cette", "ces", "nos", "notre", "votre", "vos",
            "the", "and", "for", "with", "of", "to", "an"
    );

    /**
     * Calcule le score des agences candidates pour un projet donne et
     * retourne les {@code limit} meilleures, triees par matching_score
     * decroissant.
     */
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

    // ------------------------------------------------------------------
    // Facteur localisation
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // Facteur expertise / competences (overlap de mots-cles)
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // Facteur budget — DEVIATION documentee (voir README) : le payload
    // get_project_context ne renvoie pas price_range (AgencyService), donc
    // impossible de comparer directement une fourchette de prix agence au
    // budget du projet. On utilise le chiffre d'affaires annuel comme proxy
    // de capacite financiere. Poids releve a 0.15 (voir note en tete de
    // fichier) car ce risque business reste pertinent malgre la donnee
    // approximative.
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // Facteur avis clients
    // ------------------------------------------------------------------
    private double scoreRating(CandidateAgency agency) {
        if (agency.rating() == null) {
            return NEUTRAL_SCORE;
        }
        return clamp(agency.rating() / 5.0 * 100.0);
    }

    // ------------------------------------------------------------------
    // Facteur disponibilite / qualite proxy (PQI, deja sur 0-100)
    // ------------------------------------------------------------------
    private double scorePqi(CandidateAgency agency) {
        if (agency.pqiScore() == null) {
            return NEUTRAL_SCORE;
        }
        return clamp(agency.pqiScore());
    }

    // ------------------------------------------------------------------
    // success_prediction — "Score de compatibilite" (cahier §3.3)
    // ------------------------------------------------------------------
    private double computeSuccessPrediction(CandidateAgency agency, double clientTrustScore, double ratingScore) {
        double experienceScore = Math.min(
                agency.completedProjectsOrZero() / EXPERIENCE_SATURATION_PROJECTS, 1.0) * 100.0;
        double trustScore = clamp(clientTrustScore);
        return experienceScore * EXPERIENCE_WEIGHT
                + ratingScore * SP_RATING_WEIGHT
                + trustScore * CLIENT_TRUST_WEIGHT;
    }

    /** "Facteurs explicatifs" — cahier §3.3, transparence de l'IA. */
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

    // ------------------------------------------------------------------
    // Utilitaires texte
    // ------------------------------------------------------------------
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