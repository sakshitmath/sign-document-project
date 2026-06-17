package com.signdoc.backend.service;

import com.signdoc.backend.model.AuditLog;
import com.signdoc.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(String action, Long documentId, String performedBy, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setDocumentId(documentId);
        log.setPerformedBy(performedBy);
        log.setIpAddress(ipAddress);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getAuditLogs(Long documentId) {
        return auditLogRepository.findByDocumentIdOrderByCreatedAtDesc(documentId);
    }
}