package com.digitalwardrobe.wardrobe.repository;

import com.digitalwardrobe.wardrobe.domain.WardrobeItemDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WardrobeItemRepository extends MongoRepository<WardrobeItemDocument, String> {
    List<WardrobeItemDocument> findAllByUserIdOrderByCreatedAtDesc(String userId);
    Optional<WardrobeItemDocument> findByIdAndUserId(String id, String userId);
}
