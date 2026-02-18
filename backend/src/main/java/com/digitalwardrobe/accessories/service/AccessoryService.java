package com.digitalwardrobe.accessories.service;

import com.digitalwardrobe.accessories.domain.AccessoryDocument;
import com.digitalwardrobe.accessories.dto.AccessoryResponse;
import com.digitalwardrobe.accessories.dto.CreateAccessoryRequest;
import com.digitalwardrobe.accessories.dto.UpdateAccessoryRequest;
import com.digitalwardrobe.accessories.repository.AccessoryRepository;
import com.digitalwardrobe.common.api.PageResponse;
import com.digitalwardrobe.users.service.UserService;
import java.util.ArrayList;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccessoryService {
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 30;

    private final AccessoryRepository accessoryRepository;
    private final UserService userService;

    public AccessoryService(AccessoryRepository accessoryRepository, UserService userService) {
        this.accessoryRepository = accessoryRepository;
        this.userService = userService;
    }

    public List<AccessoryResponse> list(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return accessoryRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toResponse).toList();
    }

    public PageResponse<AccessoryResponse> listPage(Authentication authentication, int page, int size) {
        String userId = userService.requireCurrentUserId(authentication);
        int resolvedPage = Math.max(page, 0);
        int resolvedSize = size <= 0 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
        var pageable = PageRequest.of(resolvedPage, resolvedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        var responsePage = accessoryRepository.findAllByUserId(userId, pageable).map(this::toResponse);
        return PageResponse.from(responsePage);
    }

    public AccessoryResponse getById(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        AccessoryDocument item = findByIdForUserOrThrow(id, userId);
        return toResponse(item);
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
        List<String> imageUrls = normalizeImageUrls(request.imageUrls(), request.imageUrl());
        String primaryImageUrl = resolvePrimaryImageUrl(request.primaryImageUrl(), imageUrls, request.imageUrl());
        item.setImageUrls(imageUrls);
        item.setPrimaryImageUrl(primaryImageUrl);
        item.setImageUrl(primaryImageUrl);
        item.setWorn(0);
        item.setFavorite(Boolean.TRUE.equals(request.favorite()));
        item.setTags(request.tags());
        item.setCreatedAt(Instant.now());
        item.setUpdatedAt(Instant.now());
        AccessoryDocument saved = accessoryRepository.save(item);
        return toResponse(saved);
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
        if (request.imageUrl() != null || request.imageUrls() != null || request.primaryImageUrl() != null) {
            applyImageUpdates(item, request.imageUrl(), request.imageUrls(), request.primaryImageUrl());
        }
        if (request.favorite() != null) {
            item.setFavorite(request.favorite());
        }
        if (request.tags() != null) {
            item.setTags(request.tags());
        }
        item.setUpdatedAt(Instant.now());
        AccessoryDocument saved = accessoryRepository.save(item);
        return toResponse(saved);
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
        return toResponse(saved);
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

    private AccessoryResponse toResponse(AccessoryDocument item) {
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
                item.getImageUrl(),
                item.getImageUrls(),
                item.getPrimaryImageUrl() != null ? item.getPrimaryImageUrl() : item.getImageUrl(),
                item.getWorn(),
                item.getLastWorn(),
                item.isFavorite(),
                item.getTags(),
                item.getCreatedAt());
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

    private void applyImageUpdates(
            AccessoryDocument item,
            String requestedImageUrl,
            List<String> requestedImageUrls,
            String requestedPrimaryImageUrl) {
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
}
