package com.signdoc.backend.service;

import com.signdoc.backend.dto.SignatureRequest;
import com.signdoc.backend.model.Document;
import com.signdoc.backend.model.Signature;
import com.signdoc.backend.model.User;
import com.signdoc.backend.repository.DocumentRepository;
import com.signdoc.backend.repository.SignatureRepository;
import com.signdoc.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SignatureService {

    private final SignatureRepository signatureRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public Signature saveSignature(SignatureRequest request, String email) {
        Document document = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new RuntimeException("Document not found"));

        User signer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Signature signature = new Signature();
        signature.setDocument(document);
        signature.setSigner(signer);
        signature.setX(request.getX());
        signature.setY(request.getY());
        signature.setPage(request.getPage());
        signature.setSignatureText(request.getSignatureText());
        signature.setStampImageBase64(request.getStampImageBase64());

        return signatureRepository.save(signature);
    }

    public List<Signature> getSignaturesByDocument(Long documentId) {
        return signatureRepository.findByDocumentId(documentId);
    }
}