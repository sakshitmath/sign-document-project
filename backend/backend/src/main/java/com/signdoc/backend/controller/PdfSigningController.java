package com.signdoc.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.signdoc.backend.service.PdfSigningService;

@RestController
@RequestMapping("/api/signatures")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PdfSigningController {

    private final PdfSigningService pdfSigningService;

    @PostMapping("/finalize/{documentId}")
    public ResponseEntity<String> finalizeDocument(
            @PathVariable Long documentId) {
        try {
            String path = pdfSigningService.signDocument(documentId);
            return ResponseEntity.ok("Document signed successfully: " + path);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}