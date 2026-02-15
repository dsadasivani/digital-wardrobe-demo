package com.digitalwardrobe.accessories.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AccessoryResponse(
        String id,
        String name,
        String category,
        String color,
        String colorHex,
        String brand,
        BigDecimal price,
        String occasion,
        Instant purchaseDate,
        String imageUrl,
        List<String> imageUrls,
        String primaryImageUrl,
        int worn,
        Instant lastWorn,
        boolean favorite,
        List<String> tags,
        Instant createdAt) {
}
