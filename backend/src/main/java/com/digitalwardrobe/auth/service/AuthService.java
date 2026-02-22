package com.digitalwardrobe.auth.service;

import com.digitalwardrobe.auth.dto.AuthResponse;
import com.digitalwardrobe.auth.dto.LoginRequest;
import com.digitalwardrobe.auth.dto.SignupRequest;
import com.digitalwardrobe.common.security.JwtService;
import com.digitalwardrobe.users.domain.UserDocument;
import com.digitalwardrobe.users.domain.UserPreferences;
import com.digitalwardrobe.users.service.UserService;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserService userService, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse signup(SignupRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userService.emailExists(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        UserDocument user = new UserDocument();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setGender(normalizeGender(request.gender()));
        user.setPreferences(new UserPreferences());
        user.setRoles(List.of("USER"));
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        UserDocument saved = userService.save(user);
        String token = jwtService.generateToken(saved.getId(), saved.getEmail(), saved.getRoles());

        return new AuthResponse(token, userService.toResponse(saved));
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        UserDocument user = userService
            .findByEmail(normalizedEmail)
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRoles());
        return new AuthResponse(token, userService.toResponse(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String normalizeGender(String gender) {
        return gender.trim().toLowerCase();
    }
}
