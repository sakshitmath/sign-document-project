package com.signdoc.backend.service;

import com.signdoc.backend.model.Document;
import com.signdoc.backend.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SigningLinkService {

    private final DocumentRepository documentRepository;
    private final EmailService emailService;

    @Value("${app.url}")
    private String appUrl;

    public String generateSigningLink(Long documentId, String recipientEmail) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        String token = UUID.randomUUID().toString();
        document.setSigningToken(token);
        documentRepository.save(document);

        String signingLink = appUrl + "/sign-public/" + token;

        emailService.sendSigningLink(recipientEmail, signingLink, document.getFileName());

        return signingLink;
    }

    public Document getDocumentByToken(String token) {
        return documentRepository.findBySigningToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid signing token"));
    }
}