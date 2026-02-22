package com.digitalwardrobe.users.service;

import com.digitalwardrobe.users.domain.UserDocument;
import com.digitalwardrobe.users.domain.UserPreferences;
import com.digitalwardrobe.users.dto.UpdateUserRequest;
import com.digitalwardrobe.users.dto.UserResponse;
import com.digitalwardrobe.users.repository.UserRepository;
import java.time.Instant;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<UserDocument> findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email));
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmailIgnoreCase(normalizeEmail(email));
    }

    public UserDocument save(UserDocument user) {
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    public UserResponse getCurrentUser(String userId) {
        UserDocument user = findByIdOrThrow(userId);
        return toResponse(user);
    }

    public UserResponse updateCurrentUser(String userId, UpdateUserRequest request) {
        UserDocument user = findByIdOrThrow(userId);
        if (request.name() != null) {
            user.setName(request.name());
        }
        if (request.email() != null && !request.email().equalsIgnoreCase(user.getEmail())) {
            if (emailExists(request.email())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
            }
            user.setEmail(normalizeEmail(request.email()));
        }
        if (request.gender() != null) {
            user.setGender(normalizeGender(request.gender()));
        }
        if (request.avatar() != null) {
            user.setAvatar(request.avatar());
        }
        if (request.preferences() != null) {
            UserPreferences preferences = user.getPreferences() != null
                ? user.getPreferences()
                : new UserPreferences();
            if (request.preferences().favoriteColors() != null) {
                preferences.setFavoriteColors(request.preferences().favoriteColors());
            }
            if (request.preferences().stylePreferences() != null) {
                preferences.setStylePreferences(request.preferences().stylePreferences());
            }
            if (request.preferences().location() != null) {
                preferences.setLocation(request.preferences().location());
            }
            if (request.preferences().notificationsEnabled() != null) {
                preferences.setNotificationsEnabled(request.preferences().notificationsEnabled());
            }
            if (request.preferences().darkMode() != null) {
                preferences.setDarkMode(request.preferences().darkMode());
            }
            user.setPreferences(preferences);
        }
        return toResponse(save(user));
    }

    public String requireCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return String.valueOf(authentication.getPrincipal());
    }

    public UserResponse toResponse(UserDocument user) {
        UserPreferences preferences = user.getPreferences() != null
            ? user.getPreferences()
            : new UserPreferences();
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getGender(),
            user.getAvatar(),
            new UserResponse.Preferences(
                preferences.getFavoriteColors(),
                preferences.getStylePreferences(),
                preferences.getLocation(),
                preferences.isNotificationsEnabled(),
                preferences.isDarkMode()
            ),
            user.getCreatedAt()
        );
    }

    private UserDocument findByIdOrThrow(String id) {
        return userRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String normalizeGender(String gender) {
        return gender.trim().toLowerCase();
    }
}
