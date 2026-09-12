package com.platform.matching.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "frappe")
public record FrappeProperties(String url, String urlContainer, String urlLocal, String internalToken) {
}
