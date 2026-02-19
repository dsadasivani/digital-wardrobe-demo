package com.digitalwardrobe.media.service;

import com.digitalwardrobe.accessories.repository.AccessoryRepository;
import com.digitalwardrobe.media.dto.ThumbnailBackfillResponse;
import com.digitalwardrobe.wardrobe.domain.WardrobeItemDocument;
import com.digitalwardrobe.wardrobe.repository.WardrobeItemRepository;
import com.digitalwardrobe.accessories.domain.AccessoryDocument;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ThumbnailBackfillService {
    private final WardrobeItemRepository wardrobeItemRepository;
    private final AccessoryRepository accessoryRepository;
    private final FirebaseStorageService firebaseStorageService;

    public ThumbnailBackfillService(
            WardrobeItemRepository wardrobeItemRepository,
            AccessoryRepository accessoryRepository,
            FirebaseStorageService firebaseStorageService) {
        this.wardrobeItemRepository = wardrobeItemRepository;
        this.accessoryRepository = accessoryRepository;
        this.firebaseStorageService = firebaseStorageService;
    }

    public ThumbnailBackfillResponse backfillForUser(String userId) {
        UserThumbnailBackfillStats stats = backfillForUser(userId, false);
        FirebaseStorageService.ThumbnailBackfillResult result = stats.storageResult();
        return new ThumbnailBackfillResponse(
                stats.wardrobeItemsScanned(),
                stats.accessoriesScanned(),
                result.totalPaths(),
                result.createdCount(),
                result.alreadyPresentCount(),
                result.notEligibleCount(),
                result.missingSourceCount(),
                result.failedCount());
    }

    public UserThumbnailBackfillStats backfillForUser(String userId, boolean dryRun) {
        Set<String> uniquePaths = new LinkedHashSet<>();

        List<WardrobeItemDocument> wardrobeItems = wardrobeItemRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        for (WardrobeItemDocument wardrobeItem : wardrobeItems) {
            collectImagePaths(wardrobeItem.getImagePaths(), uniquePaths);
        }

        List<AccessoryDocument> accessoryItems = accessoryRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        for (AccessoryDocument accessoryItem : accessoryItems) {
            collectImagePaths(accessoryItem.getImagePaths(), uniquePaths);
        }

        FirebaseStorageService.ThumbnailBackfillResult result =
                firebaseStorageService.backfillThumbnails(new ArrayList<>(uniquePaths), dryRun);
        return new UserThumbnailBackfillStats(
                userId,
                wardrobeItems.size(),
                accessoryItems.size(),
                result);
    }

    private void collectImagePaths(List<String> imagePaths, Set<String> collector) {
        if (imagePaths == null || imagePaths.isEmpty()) {
            return;
        }
        for (String imagePath : imagePaths) {
            if (!StringUtils.hasText(imagePath)) {
                continue;
            }
            collector.add(imagePath.trim());
        }
    }

    public record UserThumbnailBackfillStats(
            String userId,
            long wardrobeItemsScanned,
            long accessoriesScanned,
            FirebaseStorageService.ThumbnailBackfillResult storageResult) {
    }
}
