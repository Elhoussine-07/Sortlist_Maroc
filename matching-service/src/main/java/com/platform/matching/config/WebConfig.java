package com.platform.matching.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class WebConfig {

    @Bean
    public RestClient frappeRestClient(RestClient.Builder restClientBuilder, FrappeProperties frappeProperties) {
        
        return restClientBuilder
                .defaultHeader("X-Internal-Token", frappeProperties.internalToken())
                .build();
    }
}
