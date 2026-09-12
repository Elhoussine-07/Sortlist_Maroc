package com.platform.matching.controller;

import com.platform.matching.client.FrappeClient;
import com.platform.matching.model.AgencyServiceDto;
import com.platform.matching.model.CandidateAgency;
import com.platform.matching.model.ProjectContext;
import com.platform.matching.model.ProjectRequest;
import com.platform.matching.model.ShortlistEntry;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test d'integration : demarre le contexte Spring complet (controller reel +
 * MatchingService reel + ScoringService reel), seul FrappeClient est
 * remplace par un mock pour ne pas dependre d'un serveur Frappe reel.
 */
@SpringBootTest
@AutoConfigureMockMvc
class MatchingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FrappeClient frappeClient;

    @Value("${frappe.internal-token}")
    private String internalToken;

    private ProjectContext sampleContext() {
        ProjectRequest project = new ProjectRequest(
                "PRJ-1", "CLI-1", "Refonte site web", "Besoin d'un site vitrine",
                "Web", "Site vitrine", 20000.0, 50000.0, 30, "Casablanca"
        );
        CandidateAgency strongAgency = new CandidateAgency(
                "AG-STRONG", "Agence Forte", "Casablanca", null, 0,
                5.0, 90, 15, 2015, 1_000_000.0,
                List.of(new AgencyServiceDto("Developpement web", "React", "React, Node")),
                12
        );
        CandidateAgency weakAgency = new CandidateAgency(
                "AG-WEAK", "Agence Faible", "Marrakech", null, 0,
                1.0, 10, 2, 2023, 500.0, List.of(), 0
        );
        return new ProjectContext(project, 70.0, List.of(weakAgency, strongAgency));
    }

    @Test
    void getShortlistReturnsRankedAgenciesUnpersisted() throws Exception {
        when(frappeClient.getProjectContext("PRJ-1")).thenReturn(sampleContext());

        mockMvc.perform(get("/api/matching/PRJ-1/shortlist").header("X-Internal-Token", internalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.project").value("PRJ-1"))
                .andExpect(jsonPath("$.persisted").value(false))
                .andExpect(jsonPath("$.shortlist[0].agency").value("AG-STRONG"))
                .andExpect(jsonPath("$.shortlist.length()").value(2));

        verify(frappeClient, org.mockito.Mockito.never()).saveShortlist(any(), any());
    }

    @Test
    void postShortlistPersistsRankedResultViaFrappeClient() throws Exception {
        when(frappeClient.getProjectContext("PRJ-1")).thenReturn(sampleContext());

        mockMvc.perform(post("/api/matching/PRJ-1/shortlist").header("X-Internal-Token", internalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.persisted").value(true))
                .andExpect(jsonPath("$.shortlist[0].agency").value("AG-STRONG"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ShortlistEntry>> captor = ArgumentCaptor.forClass(List.class);
        verify(frappeClient).saveShortlist(eq("PRJ-1"), captor.capture());

        List<ShortlistEntry> saved = captor.getValue();
        assertEquals(2, saved.size());
        assertEquals("AG-STRONG", saved.get(0).agency());
    }

    @Test
    void getShortlistWithoutInternalTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/matching/PRJ-1/shortlist"))
                .andExpect(status().isUnauthorized());

        verify(frappeClient, org.mockito.Mockito.never()).getProjectContext(any());
    }

    @Test
    void getShortlistWithWrongInternalTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/matching/PRJ-1/shortlist").header("X-Internal-Token", "wrong-token"))
                .andExpect(status().isUnauthorized());

        verify(frappeClient, org.mockito.Mockito.never()).getProjectContext(any());
    }
}
