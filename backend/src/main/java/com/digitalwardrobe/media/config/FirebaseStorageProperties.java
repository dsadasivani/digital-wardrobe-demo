package com.digitalwardrobe.media.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage.firebase")
public class FirebaseStorageProperties {
    private boolean enabled = false;
    private String bucket;
    private String projectId;
    private String credentialsFile;
    private String credentialsJson;
    private String credentialsJsonBase64;
    private String rootPath = "users";
    private Duration signedUrlTtl = Duration.ofHours(24);

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getCredentialsFile() {
        return credentialsFile;
    }

    public void setCredentialsFile(String credentialsFile) {
        this.credentialsFile = credentialsFile;
    }

    public String getCredentialsJson() {
        return credentialsJson;
    }

    public void setCredentialsJson(String credentialsJson) {
        this.credentialsJson = credentialsJson;
    }

    public String getCredentialsJsonBase64() {
        return credentialsJsonBase64;
    }

    public void setCredentialsJsonBase64(String credentialsJsonBase64) {
        this.credentialsJsonBase64 = credentialsJsonBase64;
    }

    public String getRootPath() {
        return rootPath;
    }

    public void setRootPath(String rootPath) {
        this.rootPath = rootPath;
    }

    public Duration getSignedUrlTtl() {
        return signedUrlTtl;
    }

    public void setSignedUrlTtl(Duration signedUrlTtl) {
        this.signedUrlTtl = signedUrlTtl;
    }
}
