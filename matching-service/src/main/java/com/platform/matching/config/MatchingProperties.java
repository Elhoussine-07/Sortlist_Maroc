package com.platform.matching.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "matching")
public record MatchingProperties(int shortlistSize) {
}
