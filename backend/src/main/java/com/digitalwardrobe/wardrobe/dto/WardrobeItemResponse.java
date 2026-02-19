package com.digitalwardrobe.wardrobe.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record WardrobeItemResponse(
    String id,
    String name,
    String category,
    String color,
    String colorHex,
    String size,
    String brand,
    String occasion,
    BigDecimal price,
    Instant purchaseDate,
    String imageUrl,
    List<String> imageUrls,
    int imageCount,
    String primaryImageUrl,
    List<String> imagePaths,
    String primaryImagePath,
    int worn,
    Instant lastWorn,
    boolean favorite,
    List<String> tags,
    String notes,
    Instant createdAt
) {}
