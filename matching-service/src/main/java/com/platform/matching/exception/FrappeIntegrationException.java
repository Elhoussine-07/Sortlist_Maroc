package com.platform.matching.exception;

public class FrappeIntegrationException extends RuntimeException {

    public FrappeIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }

    public FrappeIntegrationException(String message) {
        super(message);
    }
}
