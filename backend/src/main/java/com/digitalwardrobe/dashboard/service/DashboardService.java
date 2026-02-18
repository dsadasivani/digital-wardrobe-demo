package com.digitalwardrobe.dashboard.service;

import com.digitalwardrobe.accessories.repository.AccessoryRepository;
import com.digitalwardrobe.dashboard.dto.DashboardSummaryResponse;
import com.digitalwardrobe.outfits.repository.OutfitRepository;
import com.digitalwardrobe.users.service.UserService;
import com.digitalwardrobe.wardrobe.domain.WardrobeItemDocument;
import com.digitalwardrobe.wardrobe.dto.WardrobeItemResponse;
import com.digitalwardrobe.wardrobe.repository.WardrobeItemRepository;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {
    private static final int UNUSED_WORN_THRESHOLD = 5;

    private final WardrobeItemRepository wardrobeItemRepository;
    private final AccessoryRepository accessoryRepository;
    private final OutfitRepository outfitRepository;
    private final UserService userService;

    public DashboardService(
        WardrobeItemRepository wardrobeItemRepository,
        AccessoryRepository accessoryRepository,
        OutfitRepository outfitRepository,
        UserService userService
    ) {
        this.wardrobeItemRepository = wardrobeItemRepository;
        this.accessoryRepository = accessoryRepository;
        this.outfitRepository = outfitRepository;
        this.userService = userService;
    }

    public DashboardSummaryResponse getSummary(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);

        long wardrobeCount = wardrobeItemRepository.countByUserId(userId);
        long accessoriesCount = accessoryRepository.countByUserId(userId);
        long outfitsCount = outfitRepository.countByUserId(userId);
        long favoriteCount = wardrobeItemRepository.countByUserIdAndFavoriteTrue(userId);
        long unusedCount = wardrobeItemRepository.countByUserIdAndWornLessThan(userId, UNUSED_WORN_THRESHOLD);

        WardrobeItemResponse mostWornItem = wardrobeItemRepository
            .findFirstByUserIdOrderByWornDescCreatedAtDesc(userId)
            .map(this::toWardrobeItemResponse)
            .orElse(null);

        List<WardrobeItemResponse> leastWornItems = wardrobeItemRepository
            .findTop3ByUserIdOrderByWornAscCreatedAtDesc(userId)
            .stream()
            .map(this::toWardrobeItemResponse)
            .toList();

        List<WardrobeItemResponse> recentlyAdded = wardrobeItemRepository
            .findTop6ByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toWardrobeItemResponse)
            .toList();

        List<WardrobeItemResponse> suggestedItems = recentlyAdded.stream().limit(3).toList();

        List<DashboardSummaryResponse.CategoryBreakdownItem> categoryBreakdown = wardrobeItemRepository
            .countByCategoryForUser(userId)
            .stream()
            .filter(item -> item.getCategory() != null && !item.getCategory().isBlank())
            .map(item -> new DashboardSummaryResponse.CategoryBreakdownItem(item.getCategory(), item.getCount()))
            .toList();

        return new DashboardSummaryResponse(
            wardrobeCount + accessoriesCount,
            accessoriesCount,
            outfitsCount,
            favoriteCount,
            unusedCount,
            mostWornItem,
            leastWornItems,
            recentlyAdded,
            suggestedItems,
            categoryBreakdown
        );
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
            item.getCreatedAt()
        );
    }
}
