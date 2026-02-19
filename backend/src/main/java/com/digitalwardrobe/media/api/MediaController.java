package com.digitalwardrobe.media.api;

import com.digitalwardrobe.media.dto.UploadedImageResponse;
import com.digitalwardrobe.media.service.FirebaseStorageService;
import com.digitalwardrobe.users.service.UserService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private final FirebaseStorageService firebaseStorageService;
    private final UserService userService;

    public MediaController(FirebaseStorageService firebaseStorageService, UserService userService) {
        this.firebaseStorageService = firebaseStorageService;
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
}
