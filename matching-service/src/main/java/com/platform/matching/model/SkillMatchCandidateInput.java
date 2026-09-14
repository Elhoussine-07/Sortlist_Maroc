package com.platform.matching.model;

import java.util.List;

public record SkillMatchCandidateInput(
        String agency,
        List<AgencyServiceDto> services
) {
}
