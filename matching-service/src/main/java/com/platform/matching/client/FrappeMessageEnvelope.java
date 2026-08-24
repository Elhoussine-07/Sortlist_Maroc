package com.platform.matching.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Les endpoints {@code /api/method/...} de Frappe enveloppent toujours la
 * valeur de retour d'une fonction {@code @frappe.whitelist} sous la cle
 * {@code message}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record FrappeMessageEnvelope<T>(T message) {
}
