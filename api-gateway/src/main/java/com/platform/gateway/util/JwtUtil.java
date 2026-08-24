package com.platform.gateway.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * HS256 sign/verify helper for the JWT shared across every service of the
 * platform (see /docs/INTEGRATION.md §3).
 *
 * Claims carried by the token: sub (email), user_type, agency_id,
 * full_name, iat, exp.
 *
 * <p>The secret comes from the env var {@code JWT_SECRET} (see
 * application.yml, property {@code jwt.secret}) and falls back to the same
 * literal Frappe falls back to ("dev-insecure-secret-change-me", see
 * {@code platform_core/platform_core/auth.py}) so a fresh dev checkout
 * works end to end without any .env file.
 *
 * <p>Frappe issues tokens with PyJWT ({@code jwt.encode(payload, secret,
 * algorithm="HS256")}), which uses the UTF-8 bytes of the secret directly
 * as the HMAC key with no minimum-length requirement. This class implements
 * HMAC-SHA256 verification manually (instead of relying on a JWT library
 * such as jjwt, whose {@code Keys.hmacShaKeyFor}/algorithm enforcement
 * rejects keys shorter than 256 bits) so that verification is
 * byte-for-byte compatible with PyJWT even for the short dev fallback
 * secret.
 */
@Component
public class JwtUtil {

    public static final String CLAIM_SUB = "sub";
    public static final String CLAIM_USER_TYPE = "user_type";
    public static final String CLAIM_AGENCY_ID = "agency_id";
    public static final String CLAIM_FULL_NAME = "full_name";

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final byte[] secretKeyBytes;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtUtil(@Value("${jwt.secret:dev-insecure-secret-change-me}") String secret) {
        this.secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Parses and validates the given compact JWT (structure, HS256
     * signature and expiry).
     *
     * @param token the raw JWT, without the "Bearer " prefix
     * @return the decoded claims
     * @throws JwtValidationException if the token is malformed, the
     *                                 signature does not match, the alg is
     *                                 unsupported, or the token is expired
     */
    public JsonNode parseAndValidate(String token) throws JwtValidationException {
        if (token == null || token.isBlank()) {
            throw new JwtValidationException("Empty token");
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new JwtValidationException("Malformed JWT (expected 3 segments)");
        }
        String headerB64 = parts[0];
        String payloadB64 = parts[1];
        String signatureB64 = parts[2];

        JsonNode header;
        try {
            header = objectMapper.readTree(base64UrlDecode(headerB64));
        } catch (Exception e) {
            throw new JwtValidationException("Malformed JWT header", e);
        }
        String alg = header.path("alg").asText("");
        if (!"HS256".equals(alg)) {
            throw new JwtValidationException("Unsupported JWT alg: " + alg);
        }

        byte[] expectedSignature;
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKeyBytes, HMAC_ALGORITHM));
            expectedSignature = mac.doFinal((headerB64 + "." + payloadB64).getBytes(StandardCharsets.US_ASCII));
        } catch (Exception e) {
            throw new JwtValidationException("Unable to compute HMAC", e);
        }

        byte[] actualSignature;
        try {
            actualSignature = base64UrlDecode(signatureB64);
        } catch (Exception e) {
            throw new JwtValidationException("Malformed JWT signature", e);
        }

        if (!MessageDigest.isEqual(expectedSignature, actualSignature)) {
            throw new JwtValidationException("Invalid JWT signature");
        }

        JsonNode claims;
        try {
            claims = objectMapper.readTree(base64UrlDecode(payloadB64));
        } catch (Exception e) {
            throw new JwtValidationException("Malformed JWT payload", e);
        }

        JsonNode exp = claims.get("exp");
        if (exp != null && !exp.isNull()) {
            long expSeconds = exp.asLong();
            long nowSeconds = System.currentTimeMillis() / 1000L;
            if (nowSeconds >= expSeconds) {
                throw new JwtValidationException("Expired JWT");
            }
        }

        return claims;
    }

    /** Convenience wrapper returning {@code false} instead of throwing. */
    public boolean isValid(String token) {
        try {
            parseAndValidate(token);
            return true;
        } catch (JwtValidationException e) {
            return false;
        }
    }

    private static byte[] base64UrlDecode(String value) {
        return Base64.getUrlDecoder().decode(padBase64(value));
    }

    private static String padBase64(String value) {
        int mod = value.length() % 4;
        if (mod == 0) {
            return value;
        }
        StringBuilder sb = new StringBuilder(value);
        for (int i = mod; i < 4; i++) {
            sb.append('=');
        }
        return sb.toString();
    }

    /** Thrown when a JWT fails structural, signature, or expiry validation. */
    public static class JwtValidationException extends Exception {
        public JwtValidationException(String message) {
            super(message);
        }

        public JwtValidationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
