package com.digitalwardrobe.outfits.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("outfits")
@CompoundIndexes({
        @CompoundIndex(name = "user_planned_dates_idx", def = "{'userId': 1, 'plannedDates': 1}"),
        @CompoundIndex(name = "user_created_at_idx", def = "{'userId': 1, 'createdAt': -1}")
})
public class OutfitDocument {
    @Id
    private String id;

    private String userId;
    private String name;
    private String category;
    private List<OutfitItemEmbed> items = new ArrayList<>();
    private String occasion;
    private String season;
    private Integer rating;
    private boolean favorite = false;
    private String notes;
    private String imageUrl;
    private Instant createdAt = Instant.now();
    private int worn = 0;
    private Instant lastWorn;
    private List<String> plannedDates = new ArrayList<>();
    private List<String> processedPlannedDates = new ArrayList<>();
    private Instant updatedAt = Instant.now();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<OutfitItemEmbed> getItems() {
        return items;
    }

    public void setItems(List<OutfitItemEmbed> items) {
        this.items = items;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getOccasion() {
        return occasion;
    }

    public void setOccasion(String occasion) {
        this.occasion = occasion;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public boolean isFavorite() {
        return favorite;
    }

    public void setFavorite(boolean favorite) {
        this.favorite = favorite;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public int getWorn() {
        return worn;
    }

    public void setWorn(int worn) {
        this.worn = worn;
    }

    public Instant getLastWorn() {
        return lastWorn;
    }

    public void setLastWorn(Instant lastWorn) {
        this.lastWorn = lastWorn;
    }

    public List<String> getPlannedDates() {
        return plannedDates;
    }

    public void setPlannedDates(List<String> plannedDates) {
        this.plannedDates = plannedDates;
    }

    public List<String> getProcessedPlannedDates() {
        return processedPlannedDates;
    }

    public void setProcessedPlannedDates(List<String> processedPlannedDates) {
        this.processedPlannedDates = processedPlannedDates;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
