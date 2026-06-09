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
        // Create uploads folder if not exists
        Files.createDirectories(Paths.get(UPLOAD_DIR));

        // Save file to disk
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Get user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Save document info to DB
        Document document = new Document();
        document.setFileName(file.getOriginalFilename());
        document.setFilePath(filePath.toString());
        document.setUploadedBy(user);

        return documentRepository.save(document);
    }

    public List<Document> getUserDocuments(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return documentRepository.findByUploadedBy(user);
    }
}