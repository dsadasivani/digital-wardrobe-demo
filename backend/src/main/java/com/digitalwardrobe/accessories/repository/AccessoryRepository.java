package com.digitalwardrobe.accessories.repository;

import com.digitalwardrobe.accessories.domain.AccessoryDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AccessoryRepository extends MongoRepository<AccessoryDocument, String> {
    List<AccessoryDocument> findAllByUserIdOrderByCreatedAtDesc(String userId);
    Page<AccessoryDocument> findAllByUserId(String userId, Pageable pageable);
    long countByUserId(String userId);

    Optional<AccessoryDocument> findByIdAndUserId(String id, String userId);
}
