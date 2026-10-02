package com.platform.matching.service;

import com.platform.matching.client.FrappeClient;
import com.platform.matching.client.IaClient;
import com.platform.matching.config.MatchingProperties;
import com.platform.matching.model.CandidateAgency;
import com.platform.matching.model.ProjectContext;
import com.platform.matching.model.ProjectRequest;
import com.platform.matching.model.ShortlistEntry;
import com.platform.matching.model.ShortlistResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires purs (Mockito, sans contexte Spring) de MatchingService :
 * seules les interactions avec FrappeClient et IaClient sont mockees,
 * ScoringService reste reel.
 */
@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private FrappeClient frappeClient;

    @Mock
    private IaClient iaClient;

    private MatchingService matchingService;

    @BeforeEach
    void setUp() {
        when(iaClient.scoreSkillMatches(any(), any())).thenReturn(Map.of());
        matchingService = new MatchingService(frappeClient, iaClient, new ScoringService(), new MatchingProperties(10));
    }

    private ProjectContext contextWithTwoAgencies() {
        ProjectRequest project = new ProjectRequest(
                "PRJ-9", "CLI-9", "Application mobile", "Application mobile de livraison",
                "Mobile", "Application", 30000.0, 80000.0, 45, "Rabat"
        );
        CandidateAgency good = new CandidateAgency(
                "AG-GOOD", "Bonne Agence", "Rabat", null, 0, 4.5, 80, 12, 2016,
                2_000_000.0, List.of(), 6, null
        );
        CandidateAgency bad = new CandidateAgency(
                "AG-BAD", "Agence Moyenne", "Tanger", null, 0, 2.0, 30, 3, 2022,
                50_000.0, List.of(), 0, null
        );
        return new ProjectContext(project, 40.0, List.of(bad, good));
    }

    @Test
    void computeShortlistWithPersistFalseNeverCallsSaveShortlist() {
        when(frappeClient.getProjectContext("PRJ-9")).thenReturn(contextWithTwoAgencies());

        ShortlistResponse response = matchingService.computeShortlist("PRJ-9", false);

        assertFalse(response.persisted());
        assertEquals("PRJ-9", response.project());
        verify(frappeClient, never()).saveShortlist(anyString(), any());
    }

    @Test
    void computeShortlistWithPersistTrueCallsSaveShortlistExactlyOnce() {
        when(frappeClient.getProjectContext("PRJ-9")).thenReturn(contextWithTwoAgencies());

        ShortlistResponse response = matchingService.computeShortlist("PRJ-9", true);

        assertTrue(response.persisted());
        verify(frappeClient, times(1)).saveShortlist(anyString(), any());
    }

    @Test
    void savedShortlistEntriesMatchScoredRankingOrder() {
        when(frappeClient.getProjectContext("PRJ-9")).thenReturn(contextWithTwoAgencies());

        matchingService.computeShortlist("PRJ-9", true);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ShortlistEntry>> captor = ArgumentCaptor.forClass(List.class);
        verify(frappeClient).saveShortlist(anyString(), captor.capture());

        List<ShortlistEntry> entries = captor.getValue();
        assertEquals(2, entries.size());
        assertEquals("AG-GOOD", entries.get(0).agency(),
                "L'agence la mieux notee doit occuper le premier rang de la shortlist persistee.");
        assertTrue(entries.get(0).score() >= entries.get(1).score());
    }

    @Test
    void computeShortlistUsesSemanticSkillScoreFromIaClient() {
        ProjectRequest project = new ProjectRequest(
                "PRJ-SEM", "CLI-1", "Boutique en ligne", "Je cherche une boutique en ligne moderne",
                "Developpement web", "E-commerce", 20000.0, 50000.0, 30, null
        );
        CandidateAgency agency = new CandidateAgency(
                "AG-SEM", "Agence Semantique", null, null, 1, null, null, 5, 2018, null, List.of(), 0, null
        );
        when(frappeClient.getProjectContext("PRJ-SEM"))
                .thenReturn(new ProjectContext(project, 50.0, List.of(agency)));
        when(iaClient.scoreSkillMatches(anyString(), any())).thenReturn(Map.of("AG-SEM", 90.0));

        ShortlistResponse response = matchingService.computeShortlist("PRJ-SEM", false);

        double skillsScore = response.shortlist().get(0).scoreBreakdown().get("skills");
        assertTrue(skillsScore > 50.0,
                "Un score semantique eleve fourni par ia-service doit se refleter dans le score de competences "
                        + "(ici, aucun mot-cle ne recoupe puisque l'agence n'a aucun service renseigne).");
    }

    @Test
    void computeShortlistPropagatesProjectIdEvenWhenNoAgencyMatches() {
        ProjectRequest project = new ProjectRequest(
                "PRJ-EMPTY", "CLI-1", "Projet sans agence", null, null, null, null, null, 10, null
        );
        when(frappeClient.getProjectContext("PRJ-EMPTY"))
                .thenReturn(new ProjectContext(project, null, List.of()));

        ShortlistResponse response = matchingService.computeShortlist("PRJ-EMPTY", false);

        assertEquals("PRJ-EMPTY", response.project());
        assertTrue(response.shortlist().isEmpty());
    }
}
