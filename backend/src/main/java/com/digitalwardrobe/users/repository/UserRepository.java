package com.digitalwardrobe.users.repository;

import com.digitalwardrobe.users.domain.UserDocument;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<UserDocument, String> {
    Optional<UserDocument> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
