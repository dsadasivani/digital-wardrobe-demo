package com.digitalwardrobe.media.api;

import com.digitalwardrobe.media.dto.AdminThumbnailBackfillRequest;
import com.digitalwardrobe.media.dto.AdminThumbnailBackfillResponse;
import com.digitalwardrobe.media.dto.ThumbnailBackfillResponse;
import com.digitalwardrobe.media.dto.UploadedImageResponse;
import com.digitalwardrobe.media.service.AdminThumbnailBackfillService;
import com.digitalwardrobe.media.service.FirebaseStorageService;
import com.digitalwardrobe.media.service.ThumbnailBackfillService;
import com.digitalwardrobe.users.service.UserService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private final FirebaseStorageService firebaseStorageService;
    private final ThumbnailBackfillService thumbnailBackfillService;
    private final AdminThumbnailBackfillService adminThumbnailBackfillService;
    private final UserService userService;

    public MediaController(
            FirebaseStorageService firebaseStorageService,
            ThumbnailBackfillService thumbnailBackfillService,
            AdminThumbnailBackfillService adminThumbnailBackfillService,
            UserService userService) {
        this.firebaseStorageService = firebaseStorageService;
        this.thumbnailBackfillService = thumbnailBackfillService;
        this.adminThumbnailBackfillService = adminThumbnailBackfillService;
        this.userService = userService;
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public List<UploadedImageResponse> uploadImages(
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam(defaultValue = "general") String scope,
            Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return firebaseStorageService.uploadImages(files, userId, scope);
    }

    @PostMapping("/images/thumbnails/backfill")
    public ThumbnailBackfillResponse backfillThumbnails(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return thumbnailBackfillService.backfillForUser(userId);
    }

    @PostMapping("/images/thumbnails/backfill/admin")
    public AdminThumbnailBackfillResponse backfillThumbnailsForUsers(
            @RequestBody(required = false) AdminThumbnailBackfillRequest request,
            Authentication authentication) {
        requireAdmin(authentication);
        return adminThumbnailBackfillService.backfillUsers(request);
    }

    private void requireAdmin(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role is required");
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role is required");
        }
    }
}
