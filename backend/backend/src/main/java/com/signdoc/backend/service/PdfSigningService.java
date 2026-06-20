package com.signdoc.backend.service;

import com.signdoc.backend.model.Document;
import com.signdoc.backend.model.Signature;
import com.signdoc.backend.repository.DocumentRepository;
import com.signdoc.backend.repository.SignatureRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;
import com.signdoc.backend.service.PdfSigningService;

import java.io.File;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PdfSigningService {

    private final DocumentRepository documentRepository;
    private final SignatureRepository signatureRepository;

    public String signDocument(Long documentId) throws IOException {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        List<Signature> signatures = signatureRepository.findByDocumentId(documentId);

        if (signatures.isEmpty()) {
            throw new RuntimeException("No signatures found for this document");
        }

        // Always load original file path
        String originalPath = document.getFilePath();
        if (originalPath.startsWith("uploads/signed_")) {
            throw new RuntimeException("Document already signed");
        }

        PDDocument pdf = org.apache.pdfbox.Loader.loadPDF(new File(originalPath));

        for (Signature sig : signatures) {
            int pageIndex = sig.getPage() - 1;
            if (pageIndex >= pdf.getNumberOfPages()) pageIndex = 0;
            PDPage page = pdf.getPage(pageIndex);

            PDPageContentStream contentStream = new PDPageContentStream(
                    pdf, page, PDPageContentStream.AppendMode.APPEND, true, true);

            contentStream.setFont(
                    new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
            contentStream.setNonStrokingColor(0f, 0f, 0f);

            float scaleX = page.getMediaBox().getWidth() / 794f;
            float scaleY = page.getMediaBox().getHeight() / 1123f;
            float pdfX = sig.getX() * scaleX;
            float pdfY = page.getMediaBox().getHeight() - (sig.getY() * scaleY);

            if (sig.getStampImageBase64() != null && !sig.getStampImageBase64().isEmpty()) {
                try {
                    String base64Data = sig.getStampImageBase64();
                    if (base64Data.contains(",")) {
                        base64Data = base64Data.split(",")[1];
                    }
                    byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);
                    org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject pdImage =
                            org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject
                                    .createFromByteArray(pdf, imageBytes, "stamp");
                    contentStream.drawImage(pdImage, pdfX, pdfY - 60f, 120f, 60f);
                    contentStream.close();
                } catch (Exception ex) {
                    System.out.println("Stamp error: " + ex.getMessage());
                    contentStream.beginText();
                    contentStream.newLineAtOffset(pdfX, pdfY);
                    contentStream.showText("[STAMP]");
                    contentStream.endText();
                    contentStream.close();
                }
            } else {
                String textToShow = (sig.getSignatureText() != null && !sig.getSignatureText().isEmpty())
                        ? sig.getSignatureText()
                        : sig.getSigner().getName();
                contentStream.beginText();
                contentStream.newLineAtOffset(pdfX, pdfY);
                contentStream.showText(textToShow);
                contentStream.endText();
                contentStream.close();
            }
        }

        String signedPath = "uploads/signed_" + System.currentTimeMillis() + "_" + document.getFileName();
        pdf.save(signedPath);
        pdf.close();

        document.setStatus("SIGNED");
        document.setFilePath(signedPath);
        documentRepository.save(document);

        return signedPath;
    }
}