package com.signdoc.backend.repository;

import com.signdoc.backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByDocumentIdOrderByCreatedAtDesc(Long documentId);
}