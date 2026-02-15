package com.digitalwardrobe.common.security;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private static final int MIN_SECRET_LENGTH = 32;

    private final SecretKey signingKey;
    private final long expirationSeconds;

    public JwtService(
        @Value("${app.security.jwt-secret}") String secret,
        @Value("${app.security.jwt-expiration-seconds}") long expirationSeconds
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret must be configured");
        }
        if (secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("JWT secret must be at least 32 characters");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(String userId, String email, List<String> roles) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(expirationSeconds);
        return Jwts.builder()
            .subject(userId)
            .claim("email", email)
            .claim("roles", roles)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(signingKey)
            .compact();
    }

    public Optional<String> extractUserId(String token) {
        return parseClaims(token).map(Claims::getSubject);
    }

    public List<String> extractRoles(String token) {
        Optional<Claims> claimsOptional = parseClaims(token);
        if (claimsOptional.isEmpty()) {
            return List.of();
        }
        Object rolesRaw = claimsOptional.get().get("roles");
        if (!(rolesRaw instanceof List<?> rolesList)) {
            return List.of();
        }
        List<String> roles = new ArrayList<>();
        for (Object role : rolesList) {
            if (role instanceof String roleValue && !roleValue.isBlank()) {
                roles.add(roleValue.trim());
            }
        }
        return roles;
    }

    public boolean isTokenValid(String token) {
        return parseClaims(token).isPresent();
    }

    private Optional<Claims> parseClaims(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
