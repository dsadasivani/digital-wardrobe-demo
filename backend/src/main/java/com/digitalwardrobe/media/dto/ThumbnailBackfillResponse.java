package com.digitalwardrobe.media.dto;

public record ThumbnailBackfillResponse(
        long wardrobeItemsScanned,
        long accessoriesScanned,
        int uniqueSourcePaths,
        int thumbnailsCreated,
        int thumbnailsAlreadyPresent,
        int skippedNotEligible,
        int skippedMissingSource,
        int failed) {
}
