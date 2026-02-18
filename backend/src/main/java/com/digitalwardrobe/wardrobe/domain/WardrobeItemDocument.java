package com.digitalwardrobe.wardrobe.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("wardrobe_items")
@CompoundIndexes({
    @CompoundIndex(name = "user_category_idx", def = "{'userId': 1, 'category': 1}"),
    @CompoundIndex(name = "user_favorite_idx", def = "{'userId': 1, 'favorite': 1}"),
    @CompoundIndex(name = "user_created_at_idx", def = "{'userId': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "user_worn_created_at_idx", def = "{'userId': 1, 'worn': -1, 'createdAt': -1}")
})
public class WardrobeItemDocument {
    @Id
    private String id;

    private String userId;
    private String name;
    private String category;
    private String color;
    private String colorHex;
    private String size;
    private String brand;
    private String occasion;
    private BigDecimal price;
    private Instant purchaseDate;
    private String imageUrl;
    private List<String> imageUrls = new ArrayList<>();
    private String primaryImageUrl;
    private int worn = 0;
    private Instant lastWorn;
    private boolean favorite = false;
    private List<String> tags = new ArrayList<>();
    private String notes;
    private Instant createdAt = Instant.now();
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getColorHex() {
        return colorHex;
    }

    public void setColorHex(String colorHex) {
        this.colorHex = colorHex;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getOccasion() {
        return occasion;
    }

    public void setOccasion(String occasion) {
        this.occasion = occasion;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Instant getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(Instant purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public String getPrimaryImageUrl() {
        return primaryImageUrl;
    }

    public void setPrimaryImageUrl(String primaryImageUrl) {
        this.primaryImageUrl = primaryImageUrl;
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

    public boolean isFavorite() {
        return favorite;
    }

    public void setFavorite(boolean favorite) {
        this.favorite = favorite;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
