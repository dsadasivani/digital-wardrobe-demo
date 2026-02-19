package com.digitalwardrobe.media.service;

import com.digitalwardrobe.media.dto.AdminThumbnailBackfillRequest;
import com.digitalwardrobe.media.dto.AdminThumbnailBackfillResponse;
import com.digitalwardrobe.users.domain.UserDocument;
import com.digitalwardrobe.users.repository.UserRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AdminThumbnailBackfillService {
    private static final int DEFAULT_BATCH_SIZE = 25;
    private static final int MAX_BATCH_SIZE = 200;
    private static final int MAX_USERS_LIMIT = 1000;

    private final UserRepository userRepository;
    private final ThumbnailBackfillService thumbnailBackfillService;

    public AdminThumbnailBackfillService(
            UserRepository userRepository,
            ThumbnailBackfillService thumbnailBackfillService) {
        this.userRepository = userRepository;
        this.thumbnailBackfillService = thumbnailBackfillService;
    }

    public AdminThumbnailBackfillResponse backfillUsers(AdminThumbnailBackfillRequest request) {
        int requestedBatchSize = request != null ? resolveBatchSize(request.batchSize()) : DEFAULT_BATCH_SIZE;
        int maxUsers = request != null ? resolveMaxUsers(request.maxUsers(), requestedBatchSize) : requestedBatchSize;
        int usersToProcess = Math.min(requestedBatchSize, maxUsers);
        String cursor = request != null && StringUtils.hasText(request.cursor()) ? request.cursor().trim() : null;
        boolean dryRun = request != null && Boolean.TRUE.equals(request.dryRun());

        List<UserDocument> fetchedUsers = fetchUsers(cursor, usersToProcess + 1);
        boolean hasMore = fetchedUsers.size() > usersToProcess;
        List<UserDocument> users = hasMore ? fetchedUsers.subList(0, usersToProcess) : fetchedUsers;
        String nextCursor = hasMore && !users.isEmpty() ? users.getLast().getId() : null;

        long wardrobeItemsScanned = 0;
        long accessoriesScanned = 0;
        int uniqueSourcePaths = 0;
        int createdCount = 0;
        int alreadyPresentCount = 0;
        int notEligibleCount = 0;
        int missingSourceCount = 0;
        int failedCount = 0;

        for (UserDocument user : users) {
            ThumbnailBackfillService.UserThumbnailBackfillStats userStats =
                    thumbnailBackfillService.backfillForUser(user.getId(), dryRun);
            FirebaseStorageService.ThumbnailBackfillResult storageResult = userStats.storageResult();
            wardrobeItemsScanned += userStats.wardrobeItemsScanned();
            accessoriesScanned += userStats.accessoriesScanned();
            uniqueSourcePaths += storageResult.totalPaths();
            createdCount += storageResult.createdCount();
            alreadyPresentCount += storageResult.alreadyPresentCount();
            notEligibleCount += storageResult.notEligibleCount();
            missingSourceCount += storageResult.missingSourceCount();
            failedCount += storageResult.failedCount();
        }

        int thumbnailsCreated = dryRun ? 0 : createdCount;
        int thumbnailsWouldCreate = dryRun ? createdCount : createdCount;
        return new AdminThumbnailBackfillResponse(
                dryRun,
                users.size(),
                nextCursor,
                hasMore,
                wardrobeItemsScanned,
                accessoriesScanned,
                uniqueSourcePaths,
                thumbnailsCreated,
                thumbnailsWouldCreate,
                alreadyPresentCount,
                notEligibleCount,
                missingSourceCount,
                failedCount);
    }

    private List<UserDocument> fetchUsers(String cursor, int fetchSize) {
        var pageable = PageRequest.of(0, fetchSize);
        if (!StringUtils.hasText(cursor)) {
            return userRepository.findAllByOrderByIdAsc(pageable);
        }
        return userRepository.findAllByIdGreaterThanOrderByIdAsc(cursor, pageable);
    }

    private int resolveBatchSize(Integer requestedBatchSize) {
        if (requestedBatchSize == null || requestedBatchSize <= 0) {
            return DEFAULT_BATCH_SIZE;
        }
        return Math.min(requestedBatchSize, MAX_BATCH_SIZE);
    }

    private int resolveMaxUsers(Integer requestedMaxUsers, int fallback) {
        if (requestedMaxUsers == null || requestedMaxUsers <= 0) {
            return fallback;
        }
        return Math.min(requestedMaxUsers, MAX_USERS_LIMIT);
    }
}
