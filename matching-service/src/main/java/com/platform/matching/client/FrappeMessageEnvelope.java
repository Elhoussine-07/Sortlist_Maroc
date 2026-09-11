package com.platform.matching.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FrappeMessageEnvelope<T>(T message) {
}
