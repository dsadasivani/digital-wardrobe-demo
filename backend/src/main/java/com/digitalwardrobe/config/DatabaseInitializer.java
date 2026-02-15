package com.digitalwardrobe.config;

import com.digitalwardrobe.users.domain.UserDocument;
import com.digitalwardrobe.users.repository.UserRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DatabaseInitializer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Value("${app.bootstrap.default-admin-enabled:false}")
    private boolean defaultAdminEnabled;

    @Value("${app.bootstrap.default-admin-email:}")
    private String defaultAdminEmail;

    @Value("${app.bootstrap.default-admin-name:}")
    private String defaultAdminName;

    @Value("${app.bootstrap.default-admin-password:}")
    private String defaultAdminPassword;

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!defaultAdminEnabled) {
                return;
            }
            if (defaultAdminEmail == null || defaultAdminEmail.isBlank()
                || defaultAdminName == null || defaultAdminName.isBlank()
                || defaultAdminPassword == null || defaultAdminPassword.isBlank()) {
                log.warn("Default admin bootstrap is enabled but required values are missing. Skipping.");
                return;
            }
            if (defaultAdminPassword.length() < 12) {
                log.warn("Default admin bootstrap password must be at least 12 chars. Skipping.");
                return;
            }
            if (userRepository.count() > 0) {
                log.info("Skipping default admin bootstrap because users already exist.");
                return;
            }
            log.info("Bootstrapping default admin user");
            UserDocument user = new UserDocument();
            user.setEmail(defaultAdminEmail.trim().toLowerCase());
            user.setName(defaultAdminName.trim());
            user.setPasswordHash(passwordEncoder.encode(defaultAdminPassword));
            user.setRoles(List.of("ADMIN"));
            userRepository.save(user);
            log.info("Default admin user created");
        };
    }
}
