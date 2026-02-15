package com.digitalwardrobe.wardrobe.service;

import com.digitalwardrobe.users.service.UserService;
import com.digitalwardrobe.wardrobe.domain.WardrobeItemDocument;
import com.digitalwardrobe.wardrobe.dto.CreateWardrobeItemRequest;
import com.digitalwardrobe.wardrobe.dto.UpdateWardrobeItemRequest;
import com.digitalwardrobe.wardrobe.dto.WardrobeItemResponse;
import com.digitalwardrobe.wardrobe.repository.WardrobeItemRepository;
import java.util.ArrayList;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WardrobeService {

    private final WardrobeItemRepository wardrobeItemRepository;
    private final UserService userService;

    public WardrobeService(WardrobeItemRepository wardrobeItemRepository, UserService userService) {
        this.wardrobeItemRepository = wardrobeItemRepository;
        this.userService = userService;
    }

    public List<WardrobeItemResponse> list(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return wardrobeItemRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toResponse).toList();
    }

    public WardrobeItemResponse getById(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        WardrobeItemDocument item = findByIdForUserOrThrow(id, userId);
        return toResponse(item);
    }

    public WardrobeItemResponse create(CreateWardrobeItemRequest request, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        WardrobeItemDocument item = new WardrobeItemDocument();
        item.setUserId(userId);
        item.setName(request.name());
        item.setCategory(request.category());
        item.setColor(request.color());
        item.setColorHex(request.colorHex());
        item.setSize(request.size());
        item.setBrand(request.brand());
        item.setOccasion(request.occasion());
        item.setPrice(request.price());
        item.setPurchaseDate(request.purchaseDate());
        List<String> imageUrls = normalizeImageUrls(request.imageUrls(), request.imageUrl());
        String primaryImageUrl = resolvePrimaryImageUrl(request.primaryImageUrl(), imageUrls, request.imageUrl());
        item.setImageUrls(imageUrls);
        item.setPrimaryImageUrl(primaryImageUrl);
        item.setImageUrl(primaryImageUrl);
        item.setFavorite(Boolean.TRUE.equals(request.favorite()));
        item.setTags(request.tags());
        item.setNotes(request.notes());
        item.setWorn(0);
        item.setCreatedAt(Instant.now());
        item.setUpdatedAt(Instant.now());
        WardrobeItemDocument saved = wardrobeItemRepository.save(item);
        return toResponse(saved);
    }

    public WardrobeItemResponse update(String id, UpdateWardrobeItemRequest request, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        WardrobeItemDocument item = findByIdForUserOrThrow(id, userId);
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
        if (request.size() != null) {
            item.setSize(request.size());
        }
        if (request.brand() != null) {
            item.setBrand(request.brand());
        }
        if (request.occasion() != null) {
            item.setOccasion(request.occasion());
        }
        if (request.price() != null) {
            item.setPrice(request.price());
        }
        if (request.purchaseDate() != null) {
            item.setPurchaseDate(request.purchaseDate());
        }
        if (request.imageUrl() != null || request.imageUrls() != null || request.primaryImageUrl() != null) {
            applyImageUpdates(item, request.imageUrl(), request.imageUrls(), request.primaryImageUrl());
        }
        if (request.worn() != null) {
            item.setWorn(request.worn());
        }
        if (request.lastWorn() != null) {
            item.setLastWorn(request.lastWorn());
        }
        if (request.favorite() != null) {
            item.setFavorite(request.favorite());
        }
        if (request.tags() != null) {
            item.setTags(request.tags());
        }
        if (request.notes() != null) {
            item.setNotes(request.notes());
        }
        item.setUpdatedAt(Instant.now());
        WardrobeItemDocument saved = wardrobeItemRepository.save(item);
        return toResponse(saved);
    }

    public void delete(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        WardrobeItemDocument item = findByIdForUserOrThrow(id, userId);
        wardrobeItemRepository.delete(item);
    }

    public WardrobeItemResponse markAsWorn(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        WardrobeItemDocument item = findByIdForUserOrThrow(id, userId);
        markAsWorn(item, 1, Instant.now());
        WardrobeItemDocument saved = wardrobeItemRepository.save(item);
        return toResponse(saved);
    }

    public void incrementWornForUserItems(String userId, Set<String> itemIds, int incrementBy, Instant wornAt) {
        if (itemIds.isEmpty() || incrementBy <= 0) {
            return;
        }
        for (String itemId : itemIds) {
            wardrobeItemRepository.findByIdAndUserId(itemId, userId).ifPresent(item -> {
                markAsWorn(item, incrementBy, wornAt);
                wardrobeItemRepository.save(item);
            });
        }
    }

    private WardrobeItemDocument findByIdForUserOrThrow(String id, String userId) {
        return wardrobeItemRepository
            .findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wardrobe item not found"));
    }

    private void markAsWorn(WardrobeItemDocument item, int incrementBy, Instant wornAt) {
        item.setWorn(item.getWorn() + incrementBy);
        item.setLastWorn(wornAt);
        item.setUpdatedAt(Instant.now());
    }

    private WardrobeItemResponse toResponse(WardrobeItemDocument item) {
        return new WardrobeItemResponse(
            item.getId(),
            item.getName(),
            item.getCategory(),
            item.getColor(),
            item.getColorHex(),
            item.getSize(),
            item.getBrand(),
            item.getOccasion(),
            item.getPrice(),
            item.getPurchaseDate(),
            item.getImageUrl(),
            item.getImageUrls(),
            item.getPrimaryImageUrl() != null ? item.getPrimaryImageUrl() : item.getImageUrl(),
            item.getWorn(),
            item.getLastWorn(),
            item.isFavorite(),
            item.getTags(),
            item.getNotes(),
            item.getCreatedAt()
        );
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
        WardrobeItemDocument item,
        String requestedImageUrl,
        List<String> requestedImageUrls,
        String requestedPrimaryImageUrl
    ) {
        List<String> currentImageUrls = normalizeImageUrls(item.getImageUrls(), item.getImageUrl());
        List<String> nextImageUrls = requestedImageUrls != null
            ? new ArrayList<>(normalizeImageUrls(requestedImageUrls, requestedImageUrl != null ? requestedImageUrl : item.getImageUrl()))
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
            item.getPrimaryImageUrl() != null ? item.getPrimaryImageUrl() : item.getImageUrl()
        );

        if (!nextImageUrls.contains(primaryImageUrl)) {
            nextImageUrls.add(0, primaryImageUrl);
        }

        item.setImageUrls(nextImageUrls);
        item.setPrimaryImageUrl(primaryImageUrl);
        item.setImageUrl(primaryImageUrl);
    }

    private String resolvePrimaryImageUrl(String requestedPrimaryImageUrl, List<String> imageUrls, String fallbackImageUrl) {
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
