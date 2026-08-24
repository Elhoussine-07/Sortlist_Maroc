package com.platform.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the API Gateway (Spring Cloud Gateway, reactive).
 *
 * The gateway is the single entry point used by the frontend
 * ({@code FRONTEND_URL}) to reach every backend microservice of the
 * platform_core monorepo. See /docs/INTEGRATION.md at the repo root for the
 * full integration contract (routing table, JWT format, env vars, ...).
 */
@SpringBootApplication
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
