package com.platform.matching.model;

import java.util.List;

public record ShortlistResponse(String project, boolean persisted, List<AgencyScore> shortlist) {
}
