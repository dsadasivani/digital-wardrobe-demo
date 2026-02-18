package com.digitalwardrobe.dashboard.service;

import com.digitalwardrobe.accessories.repository.AccessoryRepository;
import com.digitalwardrobe.dashboard.dto.DashboardCategoryBreakdownResponse;
import com.digitalwardrobe.dashboard.dto.DashboardCountersResponse;
import com.digitalwardrobe.dashboard.dto.DashboardRecentlyAddedResponse;
import com.digitalwardrobe.dashboard.dto.DashboardSummaryResponse;
import com.digitalwardrobe.dashboard.dto.DashboardWearInsightsResponse;
import com.digitalwardrobe.outfits.repository.OutfitRepository;
import com.digitalwardrobe.users.service.UserService;
import com.digitalwardrobe.wardrobe.domain.WardrobeItemDocument;
import com.digitalwardrobe.wardrobe.dto.WardrobeItemResponse;
import com.digitalwardrobe.wardrobe.repository.WardrobeItemRepository;

import java.util.ArrayList;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {
    private static final int UNUSED_WORN_THRESHOLD = 5;
    private static final int LEAST_WORN_ITEMS_LIMIT = 3;

    private final WardrobeItemRepository wardrobeItemRepository;
    private final AccessoryRepository accessoryRepository;
    private final OutfitRepository outfitRepository;
    private final UserService userService;

    public DashboardService(
            WardrobeItemRepository wardrobeItemRepository,
            AccessoryRepository accessoryRepository,
            OutfitRepository outfitRepository,
            UserService userService) {
        this.wardrobeItemRepository = wardrobeItemRepository;
        this.accessoryRepository = accessoryRepository;
        this.outfitRepository = outfitRepository;
        this.userService = userService;
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
                item.getCreatedAt());
    }
}
