package com.signdoc.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    public void sendSigningLink(String toEmail, String signingLink, String documentName) {
        // Email sending placeholder
        // In production, use JavaMailSender here
        System.out.println("=== EMAIL NOTIFICATION ===");
        System.out.println("To: " + toEmail);
        System.out.println("Document: " + documentName);
        System.out.println("Signing Link: " + signingLink);
        System.out.println("==========================");
    }
}