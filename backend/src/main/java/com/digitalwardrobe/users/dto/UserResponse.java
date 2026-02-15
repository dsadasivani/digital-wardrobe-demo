package com.digitalwardrobe.users.dto;

import java.time.Instant;
import java.util.List;

public record UserResponse(
    String id,
    String name,
    String email,
    String avatar,
    Preferences preferences,
    Instant createdAt
) {
    public record Preferences(
        List<String> favoriteColors,
        List<String> stylePreferences,
        String location,
        boolean notificationsEnabled,
        boolean darkMode
    ) {}
}
