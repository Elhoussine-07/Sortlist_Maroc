package com.platform.matching.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Reglages fonctionnels du moteur de matching (taille de la shortlist retournee). */
@ConfigurationProperties(prefix = "matching")
public record MatchingProperties(int shortlistSize) {
}
