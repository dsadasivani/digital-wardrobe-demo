package com.digitalwardrobe.wardrobe.repository;

import com.digitalwardrobe.wardrobe.domain.WardrobeItemDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WardrobeItemRepository extends MongoRepository<WardrobeItemDocument, String> {
    List<WardrobeItemDocument> findAllByUserIdOrderByCreatedAtDesc(String userId);
    Page<WardrobeItemDocument> findAllByUserId(String userId, Pageable pageable);
    long countByUserId(String userId);
    long countByUserIdAndFavoriteTrue(String userId);
    long countByUserIdAndWornLessThan(String userId, int wornThreshold);
    Optional<WardrobeItemDocument> findFirstByUserIdOrderByWornDescCreatedAtDesc(String userId);
    List<WardrobeItemDocument> findTop3ByUserIdOrderByWornAscCreatedAtDesc(String userId);
    List<WardrobeItemDocument> findTop6ByUserIdOrderByCreatedAtDesc(String userId);
    Optional<WardrobeItemDocument> findByIdAndUserId(String id, String userId);

    @Aggregation(pipeline = {
        "{ '$match': { 'userId': ?0 } }",
        "{ '$group': { '_id': '$category', 'count': { '$sum': 1 } } }",
        "{ '$project': { '_id': 0, 'category': '$_id', 'count': 1 } }",
        "{ '$sort': { 'count': -1 } }"
    })
    List<CategoryCountProjection> countByCategoryForUser(String userId);

    interface CategoryCountProjection {
        String getCategory();
        long getCount();
    }
}
