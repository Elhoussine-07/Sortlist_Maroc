package com.platform.matching.controller;

import com.platform.matching.model.ShortlistResponse;
import com.platform.matching.service.MatchingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matching")
public class MatchingController {

    private final MatchingService matchingService;

    public MatchingController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @PostMapping("/{projectId}/shortlist")
    public ResponseEntity<ShortlistResponse> computeAndSaveShortlist(@PathVariable String projectId) {
        return ResponseEntity.ok(matchingService.computeShortlist(projectId, true));
    }

    @GetMapping("/{projectId}/shortlist")
    public ResponseEntity<ShortlistResponse> getShortlist(@PathVariable String projectId) {
        return ResponseEntity.ok(matchingService.computeShortlist(projectId, false));
    }
}
