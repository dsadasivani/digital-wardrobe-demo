package com.digitalwardrobe.dashboard.service;

import com.digitalwardrobe.accessories.repository.AccessoryRepository;
import com.digitalwardrobe.dashboard.dto.DashboardCategoryBreakdownResponse;
import com.digitalwardrobe.dashboard.dto.DashboardCountersResponse;
import com.digitalwardrobe.dashboard.dto.DashboardRecentlyAddedResponse;
import com.digitalwardrobe.dashboard.dto.DashboardSummaryResponse;
import com.digitalwardrobe.dashboard.dto.DashboardWearInsightsResponse;
import com.digitalwardrobe.media.service.FirebaseStorageService;
import com.digitalwardrobe.outfits.repository.OutfitRepository;
import com.digitalwardrobe.users.service.UserService;
import com.digitalwardrobe.wardrobe.domain.WardrobeItemDocument;
import com.digitalwardrobe.wardrobe.dto.WardrobeItemResponse;
import com.digitalwardrobe.wardrobe.repository.WardrobeItemRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DashboardService {
    private static final int UNUSED_WORN_THRESHOLD = 5;
    private static final int LEAST_WORN_ITEMS_LIMIT = 3;

    private final WardrobeItemRepository wardrobeItemRepository;
    private final AccessoryRepository accessoryRepository;
    private final OutfitRepository outfitRepository;
    private final UserService userService;
    private final FirebaseStorageService firebaseStorageService;

    public DashboardService(
            WardrobeItemRepository wardrobeItemRepository,
            AccessoryRepository accessoryRepository,
            OutfitRepository outfitRepository,
            UserService userService,
            FirebaseStorageService firebaseStorageService) {
        this.wardrobeItemRepository = wardrobeItemRepository;
        this.accessoryRepository = accessoryRepository;
        this.outfitRepository = outfitRepository;
        this.userService = userService;
        this.firebaseStorageService = firebaseStorageService;
    }

    public DashboardCountersResponse getCounters(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return getCounters(userId);
    }

    public DashboardWearInsightsResponse getWearInsights(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return getWearInsights(userId);
    }

    public DashboardRecentlyAddedResponse getRecentlyAdded(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return getRecentlyAdded(userId);
    }

    public DashboardCategoryBreakdownResponse getCategoryBreakdown(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return new DashboardCategoryBreakdownResponse(getCategoryBreakdownItems(userId));
    }

    public DashboardSummaryResponse getSummary(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        DashboardCountersResponse counters = getCounters(userId);
        DashboardWearInsightsResponse wearInsights = getWearInsights(userId);
        DashboardRecentlyAddedResponse recentlyAdded = getRecentlyAdded(userId);
        List<DashboardSummaryResponse.CategoryBreakdownItem> categoryBreakdown = getCategoryBreakdownItems(userId)
                .stream()
                .map(item -> new DashboardSummaryResponse.CategoryBreakdownItem(item.category(), item.count()))
                .toList();

        return new DashboardSummaryResponse(
                counters.totalItems(),
                counters.totalAccessories(),
                counters.totalOutfits(),
                counters.favoriteCount(),
                counters.unusedCount(),
                wearInsights.mostWornItem(),
                wearInsights.leastWornItems(),
                recentlyAdded.recentlyAdded(),
                categoryBreakdown);
    }

    private DashboardCountersResponse getCounters(String userId) {
        long wardrobeCount = wardrobeItemRepository.countByUserId(userId);
        long accessoriesCount = accessoryRepository.countByUserId(userId);
        long outfitsCount = outfitRepository.countByUserId(userId);
        long favoriteCount = wardrobeItemRepository.countByUserIdAndFavoriteTrue(userId);
        long unusedCount = wardrobeItemRepository.countByUserIdAndWornLessThan(userId, UNUSED_WORN_THRESHOLD);

        return new DashboardCountersResponse(
                wardrobeCount + accessoriesCount,
                accessoriesCount,
                outfitsCount,
                favoriteCount,
                unusedCount);
    }

    private DashboardWearInsightsResponse getWearInsights(String userId) {
        WardrobeItemResponse mostWornItem = wardrobeItemRepository
                .findFirstByUserIdOrderByWornDescCreatedAtDesc(userId)
                .map(this::toWardrobeItemResponse)
                .orElse(null);

        List<WardrobeItemResponse> leastWornItems = new ArrayList<>();
        // List<WardrobeItemResponse> leastWornItems = wardrobeItemRepository
        // .findTop3ByUserIdOrderByWornAscCreatedAtDesc(userId)
        // .stream()
        // .limit(LEAST_WORN_ITEMS_LIMIT)
        // .map(this::toWardrobeItemResponse)
        // .toList();

        return new DashboardWearInsightsResponse(mostWornItem, leastWornItems);
    }

    private DashboardRecentlyAddedResponse getRecentlyAdded(String userId) {
        List<WardrobeItemResponse> recentlyAdded = wardrobeItemRepository
                .findTop10ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toWardrobeItemResponse)
                .toList();

        return new DashboardRecentlyAddedResponse(recentlyAdded);
    }

    private List<DashboardCategoryBreakdownResponse.CategoryBreakdownItem> getCategoryBreakdownItems(String userId) {
        return wardrobeItemRepository
                .countByCategoryForUser(userId)
                .stream()
                .filter(item -> item.getCategory() != null && !item.getCategory().isBlank())
                .map(item -> new DashboardCategoryBreakdownResponse.CategoryBreakdownItem(
                        item.getCategory(),
                        item.getCount()))
                .toList();
    }

    private WardrobeItemResponse toWardrobeItemResponse(WardrobeItemDocument item) {
        List<String> imagePaths = normalizeImagePaths(item.getImagePaths());
        String primaryImagePath = imagePaths.isEmpty()
                ? null
                : resolvePrimaryImagePath(item.getPrimaryImagePath(), imagePaths, imagePaths.getFirst());
        List<String> imageUrls = normalizeImageUrls(item.getImageUrls(), item.getImageUrl());
        String primaryImageUrl = resolvePrimaryImageUrl(
                item.getPrimaryImageUrl() != null ? item.getPrimaryImageUrl() : item.getImageUrl(),
                imageUrls,
                item.getImageUrl());

        if (!imagePaths.isEmpty()) {
            try {
                Map<String, String> signedUrlMap = firebaseStorageService
                        .resolvePreviewSignedUrlMap(List.of(primaryImagePath));
                String signedPrimaryUrl = signedUrlMap.get(primaryImagePath);
                if (StringUtils.hasText(signedPrimaryUrl)) {
                    primaryImageUrl = signedPrimaryUrl;
                }
            } catch (ResponseStatusException ignored) {
                // Keep fallback URLs when signing is unavailable.
            }
        }
        int imageCount = !imagePaths.isEmpty() ? imagePaths.size() : imageUrls.size();
        if (StringUtils.hasText(primaryImageUrl)) {
            imageUrls = List.of(primaryImageUrl);
        } else if (!imageUrls.isEmpty()) {
            imageUrls = List.of(imageUrls.getFirst());
        }

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
                primaryImageUrl,
                imageUrls,
                imageCount,
                primaryImageUrl,
                imagePaths,
                primaryImagePath,
                item.getWorn(),
                item.getLastWorn(),
                item.isFavorite(),
                item.getTags(),
                item.getNotes(),
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
        return "";
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
        return "";
    }
}
