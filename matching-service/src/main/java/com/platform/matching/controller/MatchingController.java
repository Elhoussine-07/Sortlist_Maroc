package com.platform.matching.controller;

import com.platform.matching.model.ShortlistResponse;
import com.platform.matching.service.MatchingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expose {@code /api/matching/**} (le Gateway route ce prefixe sans le
 * re-ecrire, cf. docs/INTEGRATION.md §5). L'authentification JWT est deja
 * verifiee en amont par le Gateway ; ce service fait confiance au reseau
 * Docker interne et ne re-decode pas le token.
 */
@RestController
@RequestMapping("/api/matching")
public class MatchingController {

    private final MatchingService matchingService;

    public MatchingController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    /**
     * Recalcule la shortlist IA du projet et la persiste cote Frappe
     * (save_shortlist) avant de la renvoyer.
     */
    @PostMapping("/{projectId}/shortlist")
    public ResponseEntity<ShortlistResponse> computeAndSaveShortlist(@PathVariable String projectId) {
        return ResponseEntity.ok(matchingService.computeShortlist(projectId, true));
    }

    /**
     * Recalcule la shortlist IA du projet sans la persister (lecture rapide,
     * ex : rafraichissement d'un affichage cote client) — reutilise le meme
     * moteur de scoring que la route POST.
     */
    @GetMapping("/{projectId}/shortlist")
    public ResponseEntity<ShortlistResponse> getShortlist(@PathVariable String projectId) {
        return ResponseEntity.ok(matchingService.computeShortlist(projectId, false));
    }
}
