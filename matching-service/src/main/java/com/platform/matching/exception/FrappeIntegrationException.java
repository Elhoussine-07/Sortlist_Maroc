package com.platform.matching.exception;

/** Erreur remontee lors d'un appel service-a-service vers Frappe (cf. FrappeClient). */
public class FrappeIntegrationException extends RuntimeException {

    public FrappeIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }

    public FrappeIntegrationException(String message) {
        super(message);
    }
}
