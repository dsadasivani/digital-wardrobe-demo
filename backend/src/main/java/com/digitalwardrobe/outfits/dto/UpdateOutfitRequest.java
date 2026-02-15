package com.digitalwardrobe.outfits.dto;

import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record UpdateOutfitRequest(
        @Size(min = 1, max = 160, message = "name must be between 1 and 160 chars") String name,
        List<CreateOutfitRequest.OutfitItemRequest> items,
        String occasion,
        String season,
        Integer rating,
        Boolean favorite,
        String notes,
        String imageUrl,
        Instant lastWorn,
        List<String> plannedDates) {
}
