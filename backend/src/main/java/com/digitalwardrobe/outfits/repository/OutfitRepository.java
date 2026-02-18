package com.digitalwardrobe.outfits.repository;

import com.digitalwardrobe.outfits.domain.OutfitDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OutfitRepository extends MongoRepository<OutfitDocument, String> {
    List<OutfitDocument> findAllByUserIdOrderByCreatedAtDesc(String userId);
    Page<OutfitDocument> findAllByUserId(String userId, Pageable pageable);
    long countByUserId(String userId);

    Optional<OutfitDocument> findByIdAndUserId(String id, String userId);

    List<OutfitDocument> findByPlannedDatesLessThanEqual(String isoDate);
}
