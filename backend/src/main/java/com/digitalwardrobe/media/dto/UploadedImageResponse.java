package com.digitalwardrobe.media.dto;

import java.time.Instant;

public record UploadedImageResponse(
        String path,
        String url,
        String contentType,
        long sizeBytes,
        Integer width,
        Integer height,
        Instant uploadedAt) {
}
