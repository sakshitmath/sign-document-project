package com.signdoc.backend.controller;

import com.signdoc.backend.dto.SignatureRequest;
import com.signdoc.backend.model.Signature;
import com.signdoc.backend.service.SignatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/signatures")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SignatureController {

    private final SignatureService signatureService;

    @PostMapping
    public ResponseEntity<Signature> saveSignature(
            @RequestBody SignatureRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        Signature signature = signatureService.saveSignature(request, email);
        return ResponseEntity.ok(signature);
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<List<Signature>> getSignatures(
            @PathVariable Long documentId) {

        List<Signature> signatures = signatureService.getSignaturesByDocument(documentId);
        return ResponseEntity.ok(signatures);
    }
}