package com.digitalwardrobe.catalog.repository;

import com.digitalwardrobe.catalog.domain.CatalogOptionDocument;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CatalogOptionRepository extends MongoRepository<CatalogOptionDocument, String> {
    List<CatalogOptionDocument> findAllByScopeAndUserIdInOrderBySortOrderAscLabelAsc(
            String scope,
            Collection<String> userIds);

    Optional<CatalogOptionDocument> findByScopeAndUserIdAndOptionId(
            String scope,
            String userId,
            String optionId);

    boolean existsByScopeAndUserIdAndOptionId(String scope, String userId, String optionId);
}
