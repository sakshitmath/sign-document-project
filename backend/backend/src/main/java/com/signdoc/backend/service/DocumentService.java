package com.signdoc.backend.service;

import com.signdoc.backend.model.Document;
import com.signdoc.backend.model.User;
import com.signdoc.backend.repository.DocumentRepository;
import com.signdoc.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    private final String UPLOAD_DIR = "uploads/";

    public Document uploadDocument(MultipartFile file, String email) throws IOException {
        // Get user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Save document info + file bytes to DB
        Document document = new Document();
        document.setFileName(file.getOriginalFilename());
        document.setFilePath(file.getOriginalFilename());
        document.setFileData(file.getBytes());
        document.setUploadedBy(user);

        return documentRepository.save(document);
    }

    public List<Document> getUserDocuments(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return documentRepository.findByUploadedBy(user);
    }
    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }
}