package com.digitalwardrobe.media.service;

import com.digitalwardrobe.media.config.FirebaseStorageProperties;
import com.digitalwardrobe.media.dto.UploadedImageResponse;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URL;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FirebaseStorageService {
    private static final long MAX_IMAGE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/avif");
    private static final DateTimeFormatter PARTITION_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy/MM").withZone(ZoneOffset.UTC);

    private final FirebaseStorageProperties properties;
    private final ObjectProvider<Storage> storageProvider;

    public FirebaseStorageService(
            FirebaseStorageProperties properties,
            ObjectProvider<Storage> storageProvider) {
        this.properties = properties;
        this.storageProvider = storageProvider;
    }

    public List<UploadedImageResponse> uploadImages(List<MultipartFile> files, String userId, String scope) {
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one file is required");
        }

        Storage storage = requireStorage();
        List<UploadedImageResponse> uploadedImages = new ArrayList<>();
        for (MultipartFile file : files) {
            uploadedImages.add(uploadSingleImage(storage, file, userId, scope));
        }
        return uploadedImages;
    }

    public Map<String, String> resolveSignedUrlMap(List<String> storagePaths) {
        if (storagePaths == null || storagePaths.isEmpty()) {
            return Map.of();
        }
        Storage storage = requireStorage();
        Map<String, String> signedUrlMap = new HashMap<>();
        for (String storagePath : storagePaths) {
            if (!StringUtils.hasText(storagePath) || signedUrlMap.containsKey(storagePath)) {
                continue;
            }
            signedUrlMap.put(storagePath, signPath(storage, storagePath.trim()));
        }
        return signedUrlMap;
    }

    private UploadedImageResponse uploadSingleImage(Storage storage, MultipartFile file, String userId, String scope) {
        validateFile(file);

        try {
            String contentType = file.getContentType() != null ? file.getContentType().trim().toLowerCase() : "";
            String storagePath = buildStoragePath(userId, scope, file.getOriginalFilename(), contentType);
            byte[] bytes = file.getBytes();
            BlobId blobId = BlobId.of(properties.getBucket().trim(), storagePath);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(contentType)
                    .setMetadata(Map.of(
                            "ownerId", sanitizePathSegment(userId, "unknown"),
                            "scope", sanitizePathSegment(scope, "general")))
                    .build();
            storage.create(blobInfo, bytes);

            ImageDimensions dimensions = readImageDimensions(bytes);
            Instant uploadedAt = Instant.now();
            String signedUrl = signPath(storage, storagePath);
            return new UploadedImageResponse(
                    storagePath,
                    signedUrl,
                    contentType,
                    file.getSize(),
                    dimensions.width(),
                    dimensions.height(),
                    uploadedAt);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded file");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds 10MB limit");
        }
        String contentType = file.getContentType() != null ? file.getContentType().trim().toLowerCase() : "";
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image type");
        }
    }

    private String buildStoragePath(String userId, String scope, String originalFilename, String contentType) {
        String rootPath = sanitizePathPrefix(properties.getRootPath(), "users");
        String safeUserId = sanitizePathSegment(userId, "unknown-user");
        String safeScope = sanitizePathSegment(scope, "general");
        String yearMonthPath = PARTITION_FORMATTER.format(Instant.now());
        String extension = resolveFileExtension(contentType, originalFilename);
        String fileName = extension.isEmpty() ? UUID.randomUUID().toString() : UUID.randomUUID() + "." + extension;
        return String.join("/", rootPath, safeUserId, safeScope, yearMonthPath, fileName);
    }

    private String resolveFileExtension(String contentType, String originalFilename) {
        if (StringUtils.hasText(originalFilename)) {
            String trimmedName = originalFilename.trim();
            int dotIndex = trimmedName.lastIndexOf('.');
            if (dotIndex > -1 && dotIndex < trimmedName.length() - 1) {
                String extension = trimmedName.substring(dotIndex + 1).toLowerCase();
                if (Set.of("jpg", "jpeg", "png", "webp", "avif").contains(extension)) {
                    return extension;
                }
            }
        }
        return switch (contentType) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/avif" -> "avif";
            default -> "jpg";
        };
    }

    private String signPath(Storage storage, String storagePath) {
        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(properties.getBucket().trim(), storagePath)).build();
        long ttlMinutes = Math.max(properties.getSignedUrlTtl().toMinutes(), 1L);
        try {
            URL signedUrl = storage.signUrl(
                    blobInfo,
                    ttlMinutes,
                    TimeUnit.MINUTES,
                    Storage.SignUrlOption.withV4Signature());
            return signedUrl.toString();
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to generate signed URL for image");
        }
    }

    private ImageDimensions readImageDimensions(byte[] bytes) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) {
                return ImageDimensions.empty();
            }
            return new ImageDimensions(image.getWidth(), image.getHeight());
        } catch (IOException ex) {
            return ImageDimensions.empty();
        }
    }

    private Storage requireStorage() {
        if (!properties.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Firebase storage is disabled");
        }
        if (!StringUtils.hasText(properties.getBucket())) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Firebase bucket is not configured");
        }
        Storage storage = storageProvider.getIfAvailable();
        if (storage == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Firebase storage is unavailable");
        }
        return storage;
    }

    private String sanitizePathPrefix(String value, String fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback;
        }
        String sanitized = value.trim().replace("\\", "/");
        while (sanitized.startsWith("/")) {
            sanitized = sanitized.substring(1);
        }
        while (sanitized.endsWith("/")) {
            sanitized = sanitized.substring(0, sanitized.length() - 1);
        }
        return StringUtils.hasText(sanitized) ? sanitized : fallback;
    }

    private String sanitizePathSegment(String value, String fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback;
        }
        String sanitized = value.trim().replaceAll("[^a-zA-Z0-9-_]", "-");
        sanitized = sanitized.replaceAll("-{2,}", "-");
        return StringUtils.hasText(sanitized) ? sanitized : fallback;
    }

    private record ImageDimensions(Integer width, Integer height) {
        private static ImageDimensions empty() {
            return new ImageDimensions(null, null);
        }
    }
}
