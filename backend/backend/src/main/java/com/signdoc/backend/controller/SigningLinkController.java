package com.signdoc.backend.controller;

import com.signdoc.backend.model.Document;
import com.signdoc.backend.service.SigningLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SigningLinkController {

    private final SigningLinkService signingLinkService;

    @PostMapping("/{documentId}/send-link")
    public ResponseEntity<String> sendSigningLink(
            @PathVariable Long documentId,
            @RequestParam String email) {
        String link = signingLinkService.generateSigningLink(documentId, email);
        return ResponseEntity.ok("Signing link generated: " + link);
    }

    @GetMapping("/public/{token}")
    public ResponseEntity<Document> getDocumentByToken(
            @PathVariable String token) {
        Document document = signingLinkService.getDocumentByToken(token);
        return ResponseEntity.ok(document);
    }
}