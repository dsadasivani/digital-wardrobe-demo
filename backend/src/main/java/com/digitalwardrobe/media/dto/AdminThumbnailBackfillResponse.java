package com.digitalwardrobe.media.dto;

public record AdminThumbnailBackfillResponse(
        boolean dryRun,
        int processedUsers,
        String nextCursor,
        boolean hasMore,
        long wardrobeItemsScanned,
        long accessoriesScanned,
        int uniqueSourcePaths,
        int thumbnailsCreated,
        int thumbnailsWouldCreate,
        int thumbnailsAlreadyPresent,
        int skippedNotEligible,
        int skippedMissingSource,
        int failed) {
}
