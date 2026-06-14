package com.signdoc.backend.repository;

import com.signdoc.backend.model.Signature;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SignatureRepository extends JpaRepository<Signature, Long> {
    List<Signature> findByDocumentId(Long documentId);
}