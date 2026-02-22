package com.digitalwardrobe.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.digitalwardrobe.auth.dto.AuthResponse;
import com.digitalwardrobe.auth.dto.LoginRequest;
import com.digitalwardrobe.auth.dto.SignupRequest;
import com.digitalwardrobe.common.security.JwtService;
import com.digitalwardrobe.users.domain.UserDocument;
import com.digitalwardrobe.users.dto.UserResponse;
import com.digitalwardrobe.users.service.UserService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Test
    void signup_ShouldNormalizeEmailAndReturnToken() {
        AuthService authService = new AuthService(userService, passwordEncoder, jwtService);
        SignupRequest request = new SignupRequest("Test User", "  USER@Example.Com ", "password123", "female");

        UserDocument savedUser = new UserDocument();
        savedUser.setId("user-1");
        savedUser.setName("Test User");
        savedUser.setEmail("user@example.com");
        savedUser.setRoles(List.of("USER"));

        when(userService.emailExists("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userService.save(any(UserDocument.class))).thenReturn(savedUser);
        when(jwtService.generateToken("user-1", "user@example.com", List.of("USER"))).thenReturn("jwt-token");
        when(userService.toResponse(savedUser)).thenReturn(
            new UserResponse("user-1", "Test User", "user@example.com", "female", null, null, null)
        );

        AuthResponse response = authService.signup(request);

        assertEquals("jwt-token", response.token());
        verify(userService).emailExists("user@example.com");
    }

    @Test
    void signup_ShouldThrowConflict_WhenEmailExists() {
        AuthService authService = new AuthService(userService, passwordEncoder, jwtService);

        when(userService.emailExists("user@example.com")).thenReturn(true);

        ResponseStatusException ex = assertThrows(
            ResponseStatusException.class,
            () -> authService.signup(new SignupRequest("A", "user@example.com", "password123", "male"))
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void login_ShouldThrowBadCredentials_WhenPasswordDoesNotMatch() {
        AuthService authService = new AuthService(userService, passwordEncoder, jwtService);

        UserDocument user = new UserDocument();
        user.setEmail("user@example.com");
        user.setPasswordHash("hash");
        when(userService.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hash")).thenReturn(false);

        assertThrows(
            BadCredentialsException.class,
            () -> authService.login(new LoginRequest("user@example.com", "wrong-password"))
        );
    }
}
