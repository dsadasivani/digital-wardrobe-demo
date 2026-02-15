package com.digitalwardrobe.users.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateUserRequest(
    @Size(min = 1, max = 120, message = "name must be between 1 and 120 chars")
    String name,
    @Email(message = "email must be valid")
    String email,
    String avatar,
    @Valid
    PreferencesPatch preferences
) {
    public record PreferencesPatch(
        List<String> favoriteColors,
        List<String> stylePreferences,
        String location,
        Boolean notificationsEnabled,
        Boolean darkMode
    ) {}
}
