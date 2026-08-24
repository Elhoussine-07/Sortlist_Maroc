package com.platform.matching.model;

import java.util.List;

/** Reponse exposee par le controller matching-service au Gateway/frontend. */
public record ShortlistResponse(String project, boolean persisted, List<AgencyScore> shortlist) {
}
