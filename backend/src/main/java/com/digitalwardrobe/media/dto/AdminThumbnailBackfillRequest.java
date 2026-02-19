package com.digitalwardrobe.media.dto;

public record AdminThumbnailBackfillRequest(
        Integer batchSize,
        Integer maxUsers,
        String cursor,
        Boolean dryRun) {
}
