package com.digitalwardrobe.common.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    @Test
    void generateToken_ShouldExtractUserAndRoles_WhenTokenIsValid() {
        JwtService jwtService = new JwtService("test-secret-value-that-is-long-enough", 3600);

        String token = jwtService.generateToken("user-1", "user@example.com", List.of("USER", "ADMIN"));

        assertTrue(jwtService.isTokenValid(token));
        assertEquals("user-1", jwtService.extractUserId(token).orElseThrow());
        assertEquals(List.of("USER", "ADMIN"), jwtService.extractRoles(token));
    }

    @Test
    void extractUserId_ShouldReturnEmpty_WhenTokenSignatureIsInvalid() {
        JwtService jwtService = new JwtService("test-secret-value-that-is-long-enough", 3600);
        String token = jwtService.generateToken("user-1", "user@example.com", List.of("USER"));
        String tampered = token.substring(0, token.length() - 1) + "x";

        assertFalse(jwtService.isTokenValid(tampered));
        assertTrue(jwtService.extractUserId(tampered).isEmpty());
        assertTrue(jwtService.extractRoles(tampered).isEmpty());
    }

    @Test
    void constructor_ShouldThrow_WhenSecretIsTooShort() {
        org.junit.jupiter.api.Assertions.assertThrows(
            IllegalStateException.class,
            () -> new JwtService("short-secret", 3600)
        );
    }
}
