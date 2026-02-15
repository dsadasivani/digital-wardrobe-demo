package com.digitalwardrobe.users.domain;

import java.util.ArrayList;
import java.util.List;

public class UserPreferences {
    private List<String> favoriteColors = new ArrayList<>();
    private List<String> stylePreferences = new ArrayList<>();
    private String location;
    private boolean notificationsEnabled = true;
    private boolean darkMode = false;

    public List<String> getFavoriteColors() {
        return favoriteColors;
    }

    public void setFavoriteColors(List<String> favoriteColors) {
        this.favoriteColors = favoriteColors;
    }

    public List<String> getStylePreferences() {
        return stylePreferences;
    }

    public void setStylePreferences(List<String> stylePreferences) {
        this.stylePreferences = stylePreferences;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public boolean isNotificationsEnabled() {
        return notificationsEnabled;
    }

    public void setNotificationsEnabled(boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }

    public boolean isDarkMode() {
        return darkMode;
    }

    public void setDarkMode(boolean darkMode) {
        this.darkMode = darkMode;
    }
}
