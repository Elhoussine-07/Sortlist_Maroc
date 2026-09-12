package com.platform.matching.config;

import com.platform.matching.security.InternalTokenFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityConfig {

    @Bean
    public FilterRegistrationBean<InternalTokenFilter> internalTokenFilter(FrappeProperties frappeProperties) {
        FilterRegistrationBean<InternalTokenFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new InternalTokenFilter(frappeProperties));
        registration.addUrlPatterns("/api/matching/*");
        registration.setOrder(1);
        return registration;
    }
}
