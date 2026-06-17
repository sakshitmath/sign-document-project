package com.signdoc.backend.controller;

import com.signdoc.backend.model.AuditLog;
import com.signdoc.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/{documentId}")
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @PathVariable Long documentId) {
        return ResponseEntity.ok(auditLogService.getAuditLogs(documentId));
    }
}