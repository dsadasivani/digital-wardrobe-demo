package com.digitalwardrobe.outfits.dto;

import java.time.Instant;
import java.util.List;

public record OutfitResponse(
        String id,
        String name,
        String category,
        List<OutfitItemResponse> items,
        String occasion,
        String season,
        Integer rating,
        boolean favorite,
        String notes,
        String imageUrl,
        Instant createdAt,
        int worn,
        Instant lastWorn,
        List<String> plannedDates) {
    public record OutfitItemResponse(
            String itemId,
            String type,
            double positionX,
            double positionY,
            double scale,
            double rotation,
            int zIndex) {
    }
}
