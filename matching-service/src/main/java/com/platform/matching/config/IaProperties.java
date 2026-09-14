package com.platform.matching.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ia")
public record IaProperties(String url) {
}
