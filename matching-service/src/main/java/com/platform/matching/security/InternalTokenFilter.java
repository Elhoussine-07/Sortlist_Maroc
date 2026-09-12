package com.platform.matching.security;

import com.platform.matching.config.FrappeProperties;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Verifie que les appels entrants sur /api/matching/** portent le meme jeton
 * partage que celui utilise par ce service pour appeler Frappe en sortant
 * (frappe.internal-token / INTERNAL_SERVICE_TOKEN), injecte par l'api-gateway.
 * Sans ce filtre, matching-service etait joignable directement sans aucune
 * verification si son port est atteignable.
 */
public class InternalTokenFilter implements Filter {

    private static final String HEADER = "X-Internal-Token";

    private final FrappeProperties frappeProperties;

    public InternalTokenFilter(FrappeProperties frappeProperties) {
        this.frappeProperties = frappeProperties;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String token = httpRequest.getHeader(HEADER);
        if (token == null || !token.equals(frappeProperties.internalToken())) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write(
                    "{\"error\":\"unauthorized\",\"message\":\"Jeton interne manquant ou invalide\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
