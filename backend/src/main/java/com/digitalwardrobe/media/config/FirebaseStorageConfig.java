package com.digitalwardrobe.media.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
@EnableConfigurationProperties(FirebaseStorageProperties.class)
public class FirebaseStorageConfig {

    @Bean
    @ConditionalOnProperty(prefix = "app.storage.firebase", name = "enabled", havingValue = "true")
    Storage firebaseStorage(FirebaseStorageProperties properties) throws IOException {
        StorageOptions.Builder optionsBuilder = StorageOptions.newBuilder();
        GoogleCredentials credentials = resolveCredentials(properties);
        if (credentials != null) {
            optionsBuilder.setCredentials(credentials);
        }
        if (StringUtils.hasText(properties.getProjectId())) {
            optionsBuilder.setProjectId(properties.getProjectId().trim());
        }
        return optionsBuilder.build().getService();
    }

    private GoogleCredentials resolveCredentials(FirebaseStorageProperties properties) throws IOException {
        if (StringUtils.hasText(properties.getCredentialsJson())) {
            return GoogleCredentials.fromStream(
                    new ByteArrayInputStream(properties.getCredentialsJson().getBytes(StandardCharsets.UTF_8)));
        }
        if (StringUtils.hasText(properties.getCredentialsJsonBase64())) {
            byte[] decoded = Base64.getDecoder().decode(properties.getCredentialsJsonBase64().trim());
            return GoogleCredentials.fromStream(new ByteArrayInputStream(decoded));
        }
        if (StringUtils.hasText(properties.getCredentialsFile())) {
            Path credentialsPath = Path.of(properties.getCredentialsFile().trim());
            try (var inputStream = Files.newInputStream(credentialsPath)) {
                return GoogleCredentials.fromStream(inputStream);
            }
        }
        return GoogleCredentials.getApplicationDefault();
    }
}
