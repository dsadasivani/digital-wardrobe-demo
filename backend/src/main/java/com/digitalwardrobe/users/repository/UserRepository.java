package com.digitalwardrobe.users.repository;

import com.digitalwardrobe.users.domain.UserDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<UserDocument, String> {
    Optional<UserDocument> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<UserDocument> findAllByOrderByIdAsc(Pageable pageable);
    List<UserDocument> findAllByIdGreaterThanOrderByIdAsc(String id, Pageable pageable);
}
