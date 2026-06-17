package com.signdoc.backend.repository;

import com.signdoc.backend.model.Document;
import com.signdoc.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUploadedBy(User user);
    Optional<Document> findBySigningToken(String signingToken);
}