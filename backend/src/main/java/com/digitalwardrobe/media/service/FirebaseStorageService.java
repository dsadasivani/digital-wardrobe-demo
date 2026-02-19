package com.digitalwardrobe.media.service;

import com.digitalwardrobe.media.config.FirebaseStorageProperties;
import com.digitalwardrobe.media.dto.UploadedImageResponse;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URL;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FirebaseStorageService {
    private static final Logger logger = LoggerFactory.getLogger(FirebaseStorageService.class);
    private static final long MAX_IMAGE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final long SIGNED_URL_CACHE_FALLBACK_MAX_ENTRIES = 10000L;
    private static final Duration SIGNED_URL_REFRESH_FALLBACK = Duration.ofMinutes(5);
    private static final Duration PREVIEW_PATH_CACHE_FALLBACK_TTL = Duration.ofHours(6);
    private static final String IMMUTABLE_CACHE_CONTROL = "public,max-age=31536000,immutable";
    private static final String THUMBNAIL_SEGMENT = "thumbnails";
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/avif");
    private static final DateTimeFormatter PARTITION_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy/MM").withZone(ZoneOffset.UTC);

    private final FirebaseStorageProperties properties;
    private final ObjectProvider<Storage> storageProvider;
    private final ConcurrentHashMap<String, CachedSignedUrl> signedUrlCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CachedPreviewPath> previewPathCache = new ConcurrentHashMap<>();
    private final boolean signedUrlCacheEnabled;
    private final long signedUrlCacheMaximumSize;
    private final Duration signedUrlCacheRefreshBeforeExpiry;
    private final boolean thumbnailsEnabled;
    private final int thumbnailMaxWidth;
    private final Duration previewPathCacheTtl;

    public FirebaseStorageService(
            FirebaseStorageProperties properties,
            ObjectProvider<Storage> storageProvider) {
        this.properties = properties;
        this.storageProvider = storageProvider;
        this.signedUrlCacheEnabled = properties.isSignedUrlCacheEnabled();
        this.signedUrlCacheMaximumSize = properties.getSignedUrlCacheMaximumSize() > 0
                ? properties.getSignedUrlCacheMaximumSize()
                : SIGNED_URL_CACHE_FALLBACK_MAX_ENTRIES;
        Duration configuredRefreshWindow = properties.getSignedUrlCacheRefreshBeforeExpiry();
        this.signedUrlCacheRefreshBeforeExpiry = configuredRefreshWindow != null && !configuredRefreshWindow.isNegative()
                ? configuredRefreshWindow
                : SIGNED_URL_REFRESH_FALLBACK;
        this.thumbnailsEnabled = properties.isThumbnailsEnabled();
        this.thumbnailMaxWidth = properties.getThumbnailMaxWidth() > 0 ? properties.getThumbnailMaxWidth() : 480;
        this.previewPathCacheTtl = PREVIEW_PATH_CACHE_FALLBACK_TTL;
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
            if (!StringUtils.hasText(storagePath)) {
                continue;
            }
            String normalizedPath = storagePath.trim();
            if (!StringUtils.hasText(normalizedPath) || signedUrlMap.containsKey(normalizedPath)) {
                continue;
            }
            signedUrlMap.put(normalizedPath, resolveSignedUrl(storage, normalizedPath));
        }
        return signedUrlMap;
    }

    public Map<String, String> resolvePreviewSignedUrlMap(List<String> storagePaths) {
        if (storagePaths == null || storagePaths.isEmpty()) {
            return Map.of();
        }
        Storage storage = requireStorage();
        Map<String, String> signedUrlMap = new HashMap<>();
        for (String storagePath : storagePaths) {
            if (!StringUtils.hasText(storagePath)) {
                continue;
            }
            String normalizedPath = storagePath.trim();
            if (!StringUtils.hasText(normalizedPath) || signedUrlMap.containsKey(normalizedPath)) {
                continue;
            }
            signedUrlMap.put(normalizedPath, resolvePreviewSignedUrl(storage, normalizedPath));
        }
        return signedUrlMap;
    }

    public ThumbnailBackfillResult backfillThumbnails(List<String> storagePaths) {
        return backfillThumbnails(storagePaths, false);
    }

    public ThumbnailBackfillResult backfillThumbnails(List<String> storagePaths, boolean dryRun) {
        if (!thumbnailsEnabled || storagePaths == null || storagePaths.isEmpty()) {
            return new ThumbnailBackfillResult(0, 0, 0, 0, 0, 0);
        }

        Storage storage = requireStorage();
        Set<String> uniquePaths = new LinkedHashSet<>();
        for (String storagePath : storagePaths) {
            if (!StringUtils.hasText(storagePath)) {
                continue;
            }
            String normalizedPath = storagePath.trim();
            if (normalizedPath.contains("/" + THUMBNAIL_SEGMENT + "/")) {
                continue;
            }
            uniquePaths.add(normalizedPath);
        }

        int createdCount = 0;
        int alreadyPresentCount = 0;
        int notEligibleCount = 0;
        int missingSourceCount = 0;
        int failedCount = 0;
        String bucket = properties.getBucket().trim();

        for (String sourcePath : uniquePaths) {
            try {
                String thumbnailPath = buildThumbnailPath(sourcePath);
                if (!StringUtils.hasText(thumbnailPath) || thumbnailPath.equals(sourcePath)) {
                    notEligibleCount++;
                    continue;
                }
                if (thumbnailExists(storage, thumbnailPath)) {
                    alreadyPresentCount++;
                    cachePreviewPath(sourcePath, thumbnailPath, Instant.now());
                    continue;
                }

                Blob sourceBlob = storage.get(BlobId.of(bucket, sourcePath));
                if (sourceBlob == null) {
                    missingSourceCount++;
                    continue;
                }

                byte[] sourceBytes = sourceBlob.getContent();
                ThumbnailPayload thumbnailPayload = buildThumbnailPayload(sourceBytes, sourceBlob.getContentType());
                if (thumbnailPayload == null) {
                    notEligibleCount++;
                    continue;
                }
                if (dryRun) {
                    createdCount++;
                    continue;
                }

                Map<String, String> metadata = new HashMap<>();
                if (sourceBlob.getMetadata() != null) {
                    String ownerId = sourceBlob.getMetadata().get("ownerId");
                    String scope = sourceBlob.getMetadata().get("scope");
                    if (StringUtils.hasText(ownerId)) {
                        metadata.put("ownerId", ownerId.trim());
                    }
                    if (StringUtils.hasText(scope)) {
                        metadata.put("scope", scope.trim());
                    }
                }
                metadata.put("sourcePath", sourcePath);
                metadata.put("variant", "thumbnail");

                BlobInfo thumbnailBlobInfo = BlobInfo.newBuilder(BlobId.of(bucket, thumbnailPath))
                        .setContentType(thumbnailPayload.contentType())
                        .setCacheControl(IMMUTABLE_CACHE_CONTROL)
                        .setMetadata(metadata)
                        .build();
                storage.create(thumbnailBlobInfo, thumbnailPayload.bytes());
                createdCount++;
                cachePreviewPath(sourcePath, thumbnailPath, Instant.now());
            } catch (Exception ex) {
                failedCount++;
                logger.warn("Thumbnail backfill failed for source path {}", sourcePath, ex);
            }
        }

        return new ThumbnailBackfillResult(
                uniquePaths.size(),
                createdCount,
                alreadyPresentCount,
                notEligibleCount,
                missingSourceCount,
                failedCount);
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
                    .setCacheControl(IMMUTABLE_CACHE_CONTROL)
                    .setMetadata(Map.of(
                            "ownerId", sanitizePathSegment(userId, "unknown"),
                            "scope", sanitizePathSegment(scope, "general")))
                    .build();
            storage.create(blobInfo, bytes);
            uploadThumbnailIfPossible(storage, storagePath, bytes, contentType, userId, scope);

            ImageDimensions dimensions = readImageDimensions(bytes);
            Instant uploadedAt = Instant.now();
            String signedUrl = resolveSignedUrl(storage, storagePath);
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

    private void uploadThumbnailIfPossible(
            Storage storage,
            String sourcePath,
            byte[] sourceBytes,
            String sourceContentType,
            String userId,
            String scope) {
        if (!thumbnailsEnabled) {
            return;
        }
        ThumbnailPayload thumbnailPayload = buildThumbnailPayload(sourceBytes, sourceContentType);
        if (thumbnailPayload == null) {
            return;
        }
        String thumbnailPath = buildThumbnailPath(sourcePath);
        if (!StringUtils.hasText(thumbnailPath) || thumbnailPath.equals(sourcePath)) {
            return;
        }

        try {
            BlobId thumbnailBlobId = BlobId.of(properties.getBucket().trim(), thumbnailPath);
            BlobInfo thumbnailBlobInfo = BlobInfo.newBuilder(thumbnailBlobId)
                    .setContentType(thumbnailPayload.contentType())
                    .setCacheControl(IMMUTABLE_CACHE_CONTROL)
                    .setMetadata(Map.of(
                            "ownerId", sanitizePathSegment(userId, "unknown"),
                            "scope", sanitizePathSegment(scope, "general"),
                            "sourcePath", sourcePath,
                            "variant", "thumbnail"))
                    .build();
            storage.create(thumbnailBlobInfo, thumbnailPayload.bytes());
            cachePreviewPath(sourcePath, thumbnailPath, Instant.now());
        } catch (Exception ex) {
            logger.warn("Thumbnail upload failed for path {}", sourcePath, ex);
        }
    }

    private ThumbnailPayload buildThumbnailPayload(byte[] sourceBytes, String sourceContentType) {
        if (sourceBytes == null || sourceBytes.length == 0) {
            return null;
        }
        try {
            BufferedImage sourceImage = ImageIO.read(new ByteArrayInputStream(sourceBytes));
            if (sourceImage == null || sourceImage.getWidth() <= 0 || sourceImage.getHeight() <= 0) {
                return null;
            }
            if (sourceImage.getWidth() <= thumbnailMaxWidth) {
                return null;
            }

            int targetWidth = thumbnailMaxWidth;
            int targetHeight = Math.max(1, (int) Math.round(
                    (double) sourceImage.getHeight() * targetWidth / sourceImage.getWidth()));
            boolean hasAlpha = sourceImage.getColorModel() != null && sourceImage.getColorModel().hasAlpha();
            String outputFormat = resolveThumbnailFormat(sourceContentType, hasAlpha);
            String outputContentType = "png".equals(outputFormat) ? "image/png" : "image/jpeg";

            BufferedImage resizedImage = resizeImage(sourceImage, targetWidth, targetHeight, outputFormat);
            if (resizedImage == null) {
                return null;
            }
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            boolean written = ImageIO.write(resizedImage, outputFormat, outputStream);
            if (!written) {
                return null;
            }
            return new ThumbnailPayload(outputStream.toByteArray(), outputContentType);
        } catch (Exception ex) {
            logger.debug("Unable to build thumbnail payload", ex);
            return null;
        }
    }

    private BufferedImage resizeImage(BufferedImage sourceImage, int targetWidth, int targetHeight, String outputFormat) {
        int targetType = "png".equals(outputFormat) ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage resizedImage = new BufferedImage(targetWidth, targetHeight, targetType);
        Graphics2D graphics = resizedImage.createGraphics();
        try {
            if (!"png".equals(outputFormat)) {
                graphics.setColor(Color.WHITE);
                graphics.fillRect(0, 0, targetWidth, targetHeight);
            }
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.drawImage(sourceImage, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }
        return resizedImage;
    }

    private String resolveThumbnailFormat(String sourceContentType, boolean hasAlpha) {
        if ("image/png".equals(sourceContentType) || hasAlpha) {
            return "png";
        }
        return "jpg";
    }

    private String resolvePreviewSignedUrl(Storage storage, String storagePath) {
        String previewPath = resolvePreviewPath(storage, storagePath);
        return resolveSignedUrl(storage, previewPath);
    }

    private String resolvePreviewPath(Storage storage, String storagePath) {
        if (!thumbnailsEnabled) {
            return storagePath;
        }
        String thumbnailPath = buildThumbnailPath(storagePath);
        if (!StringUtils.hasText(thumbnailPath) || thumbnailPath.equals(storagePath)) {
            return storagePath;
        }

        Instant now = Instant.now();
        CachedPreviewPath cached = previewPathCache.get(storagePath);
        if (cached != null && now.isBefore(cached.expiresAt())) {
            return cached.path();
        }

        String previewPath = thumbnailExists(storage, thumbnailPath) ? thumbnailPath : storagePath;
        previewPathCache.put(storagePath, new CachedPreviewPath(previewPath, now.plus(previewPathCacheTtl), now));
        evictPreviewPathCacheIfNeeded(now);
        return previewPath;
    }

    private boolean thumbnailExists(Storage storage, String thumbnailPath) {
        try {
            Blob thumbnailBlob = storage.get(BlobId.of(properties.getBucket().trim(), thumbnailPath));
            return thumbnailBlob != null;
        } catch (Exception ex) {
            logger.debug("Thumbnail existence check failed for {}", thumbnailPath, ex);
            return false;
        }
    }

    private String buildThumbnailPath(String sourcePath) {
        if (!StringUtils.hasText(sourcePath)) {
            return sourcePath;
        }
        String normalizedSourcePath = sourcePath.trim();
        String thumbnailToken = "/" + THUMBNAIL_SEGMENT + "/";
        if (normalizedSourcePath.contains(thumbnailToken)) {
            return normalizedSourcePath;
        }

        int lastSlash = normalizedSourcePath.lastIndexOf('/');
        if (lastSlash < 0 || lastSlash >= normalizedSourcePath.length() - 1) {
            return normalizedSourcePath;
        }
        String parentPath = normalizedSourcePath.substring(0, lastSlash);
        String fileName = normalizedSourcePath.substring(lastSlash + 1);
        if (!StringUtils.hasText(fileName)) {
            return normalizedSourcePath;
        }
        if (!StringUtils.hasText(parentPath)) {
            return THUMBNAIL_SEGMENT + "/" + fileName;
        }
        return parentPath + "/" + THUMBNAIL_SEGMENT + "/" + fileName;
    }

    private void cachePreviewPath(String sourcePath, String previewPath, Instant now) {
        previewPathCache.put(sourcePath, new CachedPreviewPath(previewPath, now.plus(previewPathCacheTtl), now));
        evictPreviewPathCacheIfNeeded(now);
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
        long ttlMinutes = Math.max(resolveSignedUrlTtl().toMinutes(), 1L);
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

    private String resolveSignedUrl(Storage storage, String storagePath) {
        if (!signedUrlCacheEnabled) {
            return signPath(storage, storagePath);
        }

        Instant now = Instant.now();
        CachedSignedUrl cached = signedUrlCache.get(storagePath);
        if (isUsableCachedUrl(cached, now)) {
            return cached.url();
        }

        String signedUrl = signPath(storage, storagePath);
        Instant expiresAt = now.plus(resolveSignedUrlTtl());
        signedUrlCache.put(storagePath, new CachedSignedUrl(signedUrl, expiresAt, now));
        evictSignedUrlCacheIfNeeded(now);
        return signedUrl;
    }

    private Duration resolveSignedUrlTtl() {
        Duration ttl = properties.getSignedUrlTtl();
        if (ttl == null || ttl.isNegative() || ttl.isZero()) {
            return Duration.ofMinutes(1);
        }
        return ttl;
    }

    private Duration resolveSignedUrlRefreshWindow(Duration ttl) {
        Duration configuredWindow = signedUrlCacheRefreshBeforeExpiry;
        if (configuredWindow.isZero()) {
            return Duration.ZERO;
        }
        Duration upperBound = ttl.dividedBy(2);
        if (upperBound.isZero() || upperBound.isNegative()) {
            return Duration.ZERO;
        }
        return configuredWindow.compareTo(upperBound) > 0 ? upperBound : configuredWindow;
    }

    private boolean isUsableCachedUrl(CachedSignedUrl cached, Instant now) {
        if (cached == null) {
            return false;
        }
        Duration ttl = resolveSignedUrlTtl();
        Duration refreshWindow = resolveSignedUrlRefreshWindow(ttl);
        Instant refreshThreshold = cached.expiresAt().minus(refreshWindow);
        return now.isBefore(refreshThreshold);
    }

    private void evictSignedUrlCacheIfNeeded(Instant now) {
        if (signedUrlCache.size() <= signedUrlCacheMaximumSize) {
            return;
        }
        signedUrlCache.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
        long overflow = (long) signedUrlCache.size() - signedUrlCacheMaximumSize;
        if (overflow <= 0) {
            return;
        }
        signedUrlCache.entrySet().stream()
                .sorted(Comparator.comparing(entry -> entry.getValue().cachedAt()))
                .limit(overflow)
                .map(Map.Entry::getKey)
                .toList()
                .forEach(signedUrlCache::remove);
    }

    private void evictPreviewPathCacheIfNeeded(Instant now) {
        if (previewPathCache.size() <= signedUrlCacheMaximumSize) {
            return;
        }
        previewPathCache.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
        long overflow = (long) previewPathCache.size() - signedUrlCacheMaximumSize;
        if (overflow <= 0) {
            return;
        }
        previewPathCache.entrySet().stream()
                .sorted(Comparator.comparing(entry -> entry.getValue().cachedAt()))
                .limit(overflow)
                .map(Map.Entry::getKey)
                .toList()
                .forEach(previewPathCache::remove);
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

    private record CachedSignedUrl(String url, Instant expiresAt, Instant cachedAt) {
    }

    private record CachedPreviewPath(String path, Instant expiresAt, Instant cachedAt) {
    }

    private record ThumbnailPayload(byte[] bytes, String contentType) {
    }

    public record ThumbnailBackfillResult(
            int totalPaths,
            int createdCount,
            int alreadyPresentCount,
            int notEligibleCount,
            int missingSourceCount,
            int failedCount) {
    }
}
