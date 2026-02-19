package com.digitalwardrobe.accessories.service;

import com.digitalwardrobe.accessories.domain.AccessoryDocument;
import com.digitalwardrobe.accessories.dto.AccessoryResponse;
import com.digitalwardrobe.accessories.dto.CreateAccessoryRequest;
import com.digitalwardrobe.accessories.dto.UpdateAccessoryRequest;
import com.digitalwardrobe.accessories.repository.AccessoryRepository;
import com.digitalwardrobe.common.api.PageResponse;
import com.digitalwardrobe.media.service.FirebaseStorageService;
import com.digitalwardrobe.users.service.UserService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccessoryService {
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 30;
    private static final int LIST_PREVIEW_GALLERY_LIMIT = 4;

    private final AccessoryRepository accessoryRepository;
    private final UserService userService;
    private final FirebaseStorageService firebaseStorageService;

    public AccessoryService(
            AccessoryRepository accessoryRepository,
            UserService userService,
            FirebaseStorageService firebaseStorageService) {
        this.accessoryRepository = accessoryRepository;
        this.userService = userService;
        this.firebaseStorageService = firebaseStorageService;
    }

    public List<AccessoryResponse> list(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return accessoryRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toListResponse).toList();
    }

    public PageResponse<AccessoryResponse> listPage(Authentication authentication, int page, int size) {
        String userId = userService.requireCurrentUserId(authentication);
        int resolvedPage = Math.max(page, 0);
        int resolvedSize = size <= 0 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
        var pageable = PageRequest.of(resolvedPage, resolvedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        var responsePage = accessoryRepository.findAllByUserId(userId, pageable).map(this::toListResponse);
        return PageResponse.from(responsePage);
    }

    public AccessoryResponse getById(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        AccessoryDocument item = findByIdForUserOrThrow(id, userId);
        return toDetailResponse(item);
    }

    public AccessoryResponse create(CreateAccessoryRequest request, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        AccessoryDocument item = new AccessoryDocument();
        item.setUserId(userId);
        item.setName(request.name());
        item.setCategory(request.category());
        item.setColor(request.color());
        item.setColorHex(request.colorHex());
        item.setBrand(request.brand());
        item.setPrice(request.price());
        item.setOccasion(request.occasion());
        item.setPurchaseDate(request.purchaseDate());

        List<String> imagePaths = normalizeImagePaths(request.imagePaths());
        if (!imagePaths.isEmpty()) {
            String primaryImagePath = resolvePrimaryImagePath(request.primaryImagePath(), imagePaths, null);
            applyPathImages(item, imagePaths, primaryImagePath);
        } else {
            List<String> imageUrls = normalizeImageUrls(request.imageUrls(), request.imageUrl());
            String primaryImageUrl = resolvePrimaryImageUrl(request.primaryImageUrl(), imageUrls, request.imageUrl());
            item.setImageUrls(imageUrls);
            item.setPrimaryImageUrl(primaryImageUrl);
            item.setImageUrl(primaryImageUrl);
            item.setImagePaths(List.of());
            item.setPrimaryImagePath(null);
        }

        item.setWorn(0);
        item.setFavorite(Boolean.TRUE.equals(request.favorite()));
        item.setTags(request.tags());
        item.setCreatedAt(Instant.now());
        item.setUpdatedAt(Instant.now());
        AccessoryDocument saved = accessoryRepository.save(item);
        return toDetailResponse(saved);
    }

    public AccessoryResponse update(String id, UpdateAccessoryRequest request, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        AccessoryDocument item = findByIdForUserOrThrow(id, userId);
        if (request.name() != null) {
            item.setName(request.name());
        }
        if (request.category() != null) {
            item.setCategory(request.category());
        }
        if (request.color() != null) {
            item.setColor(request.color());
        }
        if (request.colorHex() != null) {
            item.setColorHex(request.colorHex());
        }
        if (request.brand() != null) {
            item.setBrand(request.brand());
        }
        if (request.price() != null) {
            item.setPrice(request.price());
        }
        if (request.occasion() != null) {
            item.setOccasion(request.occasion());
        }
        if (request.purchaseDate() != null) {
            item.setPurchaseDate(request.purchaseDate());
        }
        if (request.imageUrl() != null
                || request.imageUrls() != null
                || request.primaryImageUrl() != null
                || request.imagePaths() != null
                || request.primaryImagePath() != null) {
            applyImageUpdates(
                    item,
                    request.imageUrl(),
                    request.imageUrls(),
                    request.primaryImageUrl(),
                    request.imagePaths(),
                    request.primaryImagePath());
        }
        if (request.favorite() != null) {
            item.setFavorite(request.favorite());
        }
        if (request.tags() != null) {
            item.setTags(request.tags());
        }
        item.setUpdatedAt(Instant.now());
        AccessoryDocument saved = accessoryRepository.save(item);
        return toDetailResponse(saved);
    }

    public void delete(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        AccessoryDocument item = findByIdForUserOrThrow(id, userId);
        accessoryRepository.delete(item);
    }

    public AccessoryResponse markAsWorn(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        AccessoryDocument item = findByIdForUserOrThrow(id, userId);
        markAsWorn(item, 1, Instant.now());
        AccessoryDocument saved = accessoryRepository.save(item);
        return toDetailResponse(saved);
    }

    public void incrementWornForUserAccessories(String userId, Set<String> accessoryIds, int incrementBy,
            Instant wornAt) {
        if (accessoryIds.isEmpty() || incrementBy <= 0) {
            return;
        }
        for (String accessoryId : accessoryIds) {
            accessoryRepository.findByIdAndUserId(accessoryId, userId).ifPresent(item -> {
                markAsWorn(item, incrementBy, wornAt);
                accessoryRepository.save(item);
            });
        }
    }

    private AccessoryDocument findByIdForUserOrThrow(String id, String userId) {
        return accessoryRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Accessory not found"));
    }

    private void markAsWorn(AccessoryDocument item, int incrementBy, Instant wornAt) {
        item.setWorn(item.getWorn() + incrementBy);
        item.setLastWorn(wornAt);
        item.setUpdatedAt(Instant.now());
    }

    private AccessoryResponse toDetailResponse(AccessoryDocument item) {
        ResolvedImages resolvedImages = resolveImagesForResponse(item, true, false, Integer.MAX_VALUE);
        return toResponse(item, resolvedImages);
    }

    private AccessoryResponse toListResponse(AccessoryDocument item) {
        ResolvedImages resolvedImages = resolveImagesForResponse(item, true, true, LIST_PREVIEW_GALLERY_LIMIT);
        return toResponse(item, resolvedImages);
    }

    private AccessoryResponse toResponse(AccessoryDocument item, ResolvedImages resolvedImages) {
        return new AccessoryResponse(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getColor(),
                item.getColorHex(),
                item.getBrand(),
                item.getPrice(),
                item.getOccasion(),
                item.getPurchaseDate(),
                resolvedImages.primaryImageUrl(),
                resolvedImages.imageUrls(),
                resolvedImages.imageCount(),
                resolvedImages.primaryImageUrl(),
                resolvedImages.imagePaths(),
                resolvedImages.primaryImagePath(),
                item.getWorn(),
                item.getLastWorn(),
                item.isFavorite(),
                item.getTags(),
                item.getCreatedAt());
    }

    private ResolvedImages resolveImagesForResponse(
            AccessoryDocument item,
            boolean includeGallery,
            boolean preferPreviewUrls,
            int galleryLimit) {
        List<String> imagePaths = normalizeImagePaths(item.getImagePaths());
        if (!imagePaths.isEmpty()) {
            int imageCount = imagePaths.size();
            String primaryImagePath = resolvePrimaryImagePath(item.getPrimaryImagePath(), imagePaths, imagePaths.getFirst());
            List<String> selectedImagePaths = includeGallery
                    ? limitGalleryEntries(imagePaths, primaryImagePath, galleryLimit)
                    : List.of(primaryImagePath);
            try {
                Map<String, String> signedUrlMap = preferPreviewUrls
                        ? firebaseStorageService.resolvePreviewSignedUrlMap(selectedImagePaths)
                        : firebaseStorageService.resolveSignedUrlMap(selectedImagePaths);
                String primaryImageUrl = signedUrlMap.get(primaryImagePath);
                if (!StringUtils.hasText(primaryImageUrl)) {
                    primaryImageUrl = resolveFallbackPrimaryImageUrl(item);
                }
                if (!StringUtils.hasText(primaryImageUrl)) {
                    primaryImageUrl = selectedImagePaths.stream()
                            .map(path -> signedUrlMap.get(path))
                            .filter(StringUtils::hasText)
                            .findFirst()
                            .orElse(null);
                }
                if (StringUtils.hasText(primaryImageUrl)) {
                    List<String> imageUrls = includeGallery
                            ? selectedImagePaths.stream()
                                    .map(path -> signedUrlMap.get(path))
                                    .filter(StringUtils::hasText)
                                    .toList()
                            : List.of(primaryImageUrl);
                    if (!imageUrls.isEmpty()) {
                        List<String> responseImagePaths = includeGallery ? selectedImagePaths : List.of(primaryImagePath);
                        return new ResolvedImages(primaryImageUrl, imageUrls, responseImagePaths, primaryImagePath, imageCount);
                    }
                }
            } catch (ResponseStatusException ignored) {
                // Fall back to stored URLs in case storage signing is unavailable.
            }
            List<String> fallbackImageUrls = normalizeImageUrls(item.getImageUrls(), item.getImageUrl());
            String fallbackPrimaryImageUrl = resolvePrimaryImageUrl(
                    item.getPrimaryImageUrl(),
                    fallbackImageUrls,
                    item.getImageUrl());
            List<String> responseImageUrls = includeGallery
                    ? limitGalleryEntries(fallbackImageUrls, fallbackPrimaryImageUrl, galleryLimit)
                    : (StringUtils.hasText(fallbackPrimaryImageUrl)
                            ? List.of(fallbackPrimaryImageUrl)
                            : fallbackImageUrls.stream().limit(1).toList());
            List<String> responseImagePaths = includeGallery ? selectedImagePaths : List.of(primaryImagePath);
            return new ResolvedImages(
                    fallbackPrimaryImageUrl,
                    responseImageUrls,
                    responseImagePaths,
                    primaryImagePath,
                    imageCount);
        }

        List<String> imageUrls = normalizeImageUrls(item.getImageUrls(), item.getImageUrl());
        int imageCount = imageUrls.size();
        String primaryImageUrl = resolvePrimaryImageUrl(item.getPrimaryImageUrl(), imageUrls, item.getImageUrl());
        List<String> responseImageUrls = includeGallery
                ? limitGalleryEntries(imageUrls, primaryImageUrl, galleryLimit)
                : (StringUtils.hasText(primaryImageUrl)
                        ? List.of(primaryImageUrl)
                        : imageUrls.stream().limit(1).toList());
        return new ResolvedImages(primaryImageUrl, responseImageUrls, List.of(), null, imageCount);
    }

    private List<String> limitGalleryEntries(List<String> entries, String primaryEntry, int limit) {
        if (entries == null || entries.isEmpty()) {
            return List.of();
        }

        List<String> ordered = new ArrayList<>();
        if (StringUtils.hasText(primaryEntry) && entries.contains(primaryEntry)) {
            ordered.add(primaryEntry);
        }
        for (String entry : entries) {
            if (!StringUtils.hasText(entry) || ordered.contains(entry)) {
                continue;
            }
            ordered.add(entry);
        }
        if (limit <= 0 || ordered.size() <= limit) {
            return ordered;
        }
        return new ArrayList<>(ordered.subList(0, limit));
    }

    private String resolveFallbackPrimaryImageUrl(AccessoryDocument item) {
        List<String> fallbackImageUrls = normalizeImageUrls(item.getImageUrls(), item.getImageUrl());
        return resolvePrimaryImageUrl(
                item.getPrimaryImageUrl(),
                fallbackImageUrls,
                item.getImageUrl());
    }

    private List<String> normalizeImageUrls(List<String> imageUrls, String fallbackImageUrl) {
        List<String> normalized = new ArrayList<>();
        if (imageUrls != null) {
            normalized = imageUrls.stream()
                    .filter(url -> url != null && !url.isBlank())
                    .map(String::trim)
                    .toList();
        }
        if (normalized.isEmpty() && fallbackImageUrl != null && !fallbackImageUrl.isBlank()) {
            normalized = List.of(fallbackImageUrl.trim());
        }
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one image URL is required");
        }
        return normalized;
    }

    private List<String> normalizeImagePaths(List<String> imagePaths) {
        if (imagePaths == null) {
            return List.of();
        }
        return imagePaths.stream()
                .filter(path -> path != null && !path.isBlank())
                .map(String::trim)
                .toList();
    }

    private void applyImageUpdates(
            AccessoryDocument item,
            String requestedImageUrl,
            List<String> requestedImageUrls,
            String requestedPrimaryImageUrl,
            List<String> requestedImagePaths,
            String requestedPrimaryImagePath) {
        List<String> currentImagePaths = normalizeImagePaths(item.getImagePaths());
        if (requestedImagePaths != null || requestedPrimaryImagePath != null || !currentImagePaths.isEmpty()) {
            List<String> nextImagePaths = requestedImagePaths != null
                    ? new ArrayList<>(normalizeImagePaths(requestedImagePaths))
                    : new ArrayList<>(currentImagePaths);
            if (nextImagePaths.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one image path is required");
            }
            String primaryImagePath = resolvePrimaryImagePath(
                    requestedPrimaryImagePath,
                    nextImagePaths,
                    item.getPrimaryImagePath());
            if (!nextImagePaths.contains(primaryImagePath)) {
                nextImagePaths.add(0, primaryImagePath);
            }
            applyPathImages(item, nextImagePaths, primaryImagePath);
            return;
        }

        List<String> currentImageUrls = normalizeImageUrls(item.getImageUrls(), item.getImageUrl());
        List<String> nextImageUrls = requestedImageUrls != null
                ? new ArrayList<>(normalizeImageUrls(requestedImageUrls,
                        requestedImageUrl != null ? requestedImageUrl : item.getImageUrl()))
                : new ArrayList<>(currentImageUrls);

        if (requestedImageUrl != null && !requestedImageUrl.isBlank()) {
            String normalizedRequestedImageUrl = requestedImageUrl.trim();
            if (!nextImageUrls.contains(normalizedRequestedImageUrl)) {
                nextImageUrls.add(0, normalizedRequestedImageUrl);
            }
        }

        String primaryImageUrl = resolvePrimaryImageUrl(
                requestedPrimaryImageUrl != null ? requestedPrimaryImageUrl : requestedImageUrl,
                nextImageUrls,
                item.getPrimaryImageUrl() != null ? item.getPrimaryImageUrl() : item.getImageUrl());

        if (!nextImageUrls.contains(primaryImageUrl)) {
            nextImageUrls.add(0, primaryImageUrl);
        }

        item.setImageUrls(nextImageUrls);
        item.setPrimaryImageUrl(primaryImageUrl);
        item.setImageUrl(primaryImageUrl);
        item.setImagePaths(List.of());
        item.setPrimaryImagePath(null);
    }

    private void applyPathImages(AccessoryDocument item, List<String> imagePaths, String primaryImagePath) {
        Map<String, String> signedUrlMap = firebaseStorageService.resolveSignedUrlMap(imagePaths);
        List<String> imageUrls = imagePaths.stream()
                .map(path -> signedUrlMap.get(path))
                .filter(StringUtils::hasText)
                .toList();
        if (imageUrls.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to resolve image URLs");
        }
        String primaryImageUrl = signedUrlMap.get(primaryImagePath);
        if (!StringUtils.hasText(primaryImageUrl)) {
            primaryImageUrl = imageUrls.getFirst();
        }

        item.setImagePaths(new ArrayList<>(imagePaths));
        item.setPrimaryImagePath(primaryImagePath);
        item.setImageUrls(imageUrls);
        item.setPrimaryImageUrl(primaryImageUrl);
        item.setImageUrl(primaryImageUrl);
    }

    private String resolvePrimaryImageUrl(String requestedPrimaryImageUrl, List<String> imageUrls,
            String fallbackImageUrl) {
        if (requestedPrimaryImageUrl != null && !requestedPrimaryImageUrl.isBlank()) {
            String normalizedPrimaryImageUrl = requestedPrimaryImageUrl.trim();
            if (imageUrls.contains(normalizedPrimaryImageUrl) || imageUrls.isEmpty()) {
                return normalizedPrimaryImageUrl;
            }
        }
        if (fallbackImageUrl != null && !fallbackImageUrl.isBlank() && imageUrls.contains(fallbackImageUrl.trim())) {
            return fallbackImageUrl.trim();
        }
        if (!imageUrls.isEmpty()) {
            return imageUrls.getFirst();
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one image URL is required");
    }

    private String resolvePrimaryImagePath(String requestedPrimaryImagePath, List<String> imagePaths,
            String fallbackImagePath) {
        if (requestedPrimaryImagePath != null && !requestedPrimaryImagePath.isBlank()) {
            String normalizedPrimaryImagePath = requestedPrimaryImagePath.trim();
            if (imagePaths.contains(normalizedPrimaryImagePath) || imagePaths.isEmpty()) {
                return normalizedPrimaryImagePath;
            }
        }
        if (fallbackImagePath != null && !fallbackImagePath.isBlank() && imagePaths.contains(fallbackImagePath.trim())) {
            return fallbackImagePath.trim();
        }
        if (!imagePaths.isEmpty()) {
            return imagePaths.getFirst();
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one image path is required");
    }

    private record ResolvedImages(
            String primaryImageUrl,
            List<String> imageUrls,
            List<String> imagePaths,
            String primaryImagePath,
            int imageCount) {
    }
}
