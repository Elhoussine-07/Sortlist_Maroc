package com.platform.matching.service;

import com.platform.matching.model.AgencyScore;
import com.platform.matching.model.AgencyServiceDto;
import com.platform.matching.model.CandidateAgency;
import com.platform.matching.model.ProjectRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScoringServiceTest {

    private final ScoringService scoringService = new ScoringService();

    private ProjectRequest projectIn(String location, String category, String subCategory) {
        return new ProjectRequest(
                "PRJ-1", "CLI-1", "Refonte site web", "Besoin d'un site vitrine moderne",
                category, subCategory, 20000.0, 50000.0, 30, location
        );
    }

    private CandidateAgency agency(String location, String coverage, boolean remoteWork,
                                    Double rating, Integer pqiScore, Double annualRevenue,
                                    List<AgencyServiceDto> services, int completedProjects) {
        return new CandidateAgency(
                "AG-1", "Agence Test", location, coverage, remoteWork ? 1 : 0,
                rating, pqiScore, 10, 2015, annualRevenue, services, completedProjects
        );
    }

    @Test
    void remoteWorkAgencyGetsFullLocationScore() {
        CandidateAgency remoteAgency = agency("Rabat", null, true, null, null, null, List.of(), 0);
        ProjectRequest project = projectIn("Casablanca", "Web", "Site vitrine");

        List<AgencyScore> results = scoringService.score(project, 50.0, List.of(remoteAgency), 5);

        assertEquals(1, results.size());
        assertEquals(100.0, results.get(0).scoreBreakdown().get("location"));
    }

    @Test
    void unrelatedLocationWithoutCoverageGetsLowScore() {
        CandidateAgency farAgency = agency("Marrakech", null, false, null, null, null, List.of(), 0);
        ProjectRequest project = projectIn("Casablanca", "Web", "Site vitrine");

        List<AgencyScore> results = scoringService.score(project, 50.0, List.of(farAgency), 5);

        assertEquals(20.0, results.get(0).scoreBreakdown().get("location"));
    }

    @Test
    void coverageMatchingProjectLocationScoresLikeExactMatch() {
        CandidateAgency coveredAgency = agency("Rabat", "Casablanca, Rabat, Tanger", false, null, null, null, List.of(), 0);
        ProjectRequest project = projectIn("Casablanca", "Web", "Site vitrine");

        List<AgencyScore> results = scoringService.score(project, 50.0, List.of(coveredAgency), 5);

        assertEquals(100.0, results.get(0).scoreBreakdown().get("location"));
    }

    @Test
    void skillsOverlapIncreasesScoreOverAgencyWithNoMatchingSkills() {
        AgencyServiceDto webService = new AgencyServiceDto("Developpement web", "React, Node.js", "React, Node, PostgreSQL");
        AgencyServiceDto unrelatedService = new AgencyServiceDto("Comptabilite", "Audit financier", "Excel, SAP");

        CandidateAgency webAgency = agency(null, null, true, null, null, null, List.of(webService), 0);
        CandidateAgency unrelatedAgency = agency(null, null, true, null, null, null, List.of(unrelatedService), 0);

        ProjectRequest project = projectIn(null, "Developpement web", "Site vitrine React");

        double webAgencyScore = scoringService.score(project, 50.0, List.of(webAgency), 5)
                .get(0).scoreBreakdown().get("skills");
        double unrelatedAgencyScore = scoringService.score(project, 50.0, List.of(unrelatedAgency), 5)
                .get(0).scoreBreakdown().get("skills");

        assertTrue(webAgencyScore > unrelatedAgencyScore,
                "Une agence dont les competences recoupent le besoin doit obtenir un meilleur score que celle qui n'a rien en commun.");
    }

    @Test
    void budgetFitIsFullWhenAgencyRevenueComfortablyExceedsBudget() {
        CandidateAgency comfortableAgency = agency(null, null, true, null, null, 1_000_000.0, List.of(), 0);
        ProjectRequest project = projectIn(null, null, null);

        List<AgencyScore> results = scoringService.score(project, 50.0, List.of(comfortableAgency), 5);

        assertEquals(100.0, results.get(0).scoreBreakdown().get("budget"));
    }

    @Test
    void ratingScoreScalesFiveStarsToOneHundred() {
        CandidateAgency topRated = agency(null, null, true, 5.0, null, null, List.of(), 0);
        ProjectRequest project = projectIn(null, null, null);

        List<AgencyScore> results = scoringService.score(project, 50.0, List.of(topRated), 5);

        assertEquals(100.0, results.get(0).scoreBreakdown().get("rating"));
    }

    @Test
    void resultsAreSortedByMatchingScoreDescendingAndRespectLimit() {
        CandidateAgency strongAgency = agency("Casablanca", null, false, 5.0, 90, 1_000_000.0, List.of(), 8);
        CandidateAgency weakAgency = agency("Marrakech", null, false, 1.0, 10, 100.0, List.of(), 0);
        ProjectRequest project = projectIn("Casablanca", null, null);

        List<AgencyScore> results = scoringService.score(project, 50.0, List.of(weakAgency, strongAgency), 1);

        assertEquals(1, results.size(), "La limite doit etre respectee.");
        assertEquals("AG-1", results.get(0).agency());
        assertTrue(results.get(0).matchingScore() > 0,
                "L'agence la mieux notee doit ressortir en premier apres tri decroissant.");
    }

    @Test
    void successPredictionRewardsCompletedProjectsAndClientTrust() {
        CandidateAgency experiencedAgency = agency(null, null, true, 4.0, null, null, List.of(), 20);
        CandidateAgency newAgency = agency(null, null, true, 4.0, null, null, List.of(), 0);
        ProjectRequest project = projectIn(null, null, null);

        double experiencedPrediction = scoringService.score(project, 80.0, List.of(experiencedAgency), 5)
                .get(0).successPrediction();
        double newAgencyPrediction = scoringService.score(project, 80.0, List.of(newAgency), 5)
                .get(0).successPrediction();

        assertTrue(experiencedPrediction > newAgencyPrediction,
                "Une agence ayant deja termine des projets doit obtenir une meilleure prediction de succes.");
    }

    @Test
    void matchingScoreStaysWithinZeroToHundredRange() {
        CandidateAgency agency = agency("Casablanca", null, false, 5.0, 100, 5_000_000.0, List.of(), 15);
        ProjectRequest project = projectIn("Casablanca", "Web", "Site vitrine");

        AgencyScore result = scoringService.score(project, 100.0, List.of(agency), 5).get(0);

        assertTrue(result.matchingScore() >= 0.0 && result.matchingScore() <= 100.0);
        assertTrue(result.successPrediction() >= 0.0 && result.successPrediction() <= 100.0);
    }
}
