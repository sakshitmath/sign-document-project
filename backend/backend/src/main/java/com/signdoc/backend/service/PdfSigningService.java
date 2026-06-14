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

        PDDocument pdf = org.apache.pdfbox.Loader.loadPDF(new File(document.getFilePath()));

        for (Signature sig : signatures) {
            int pageIndex = sig.getPage() - 1;
            PDPage page = pdf.getPage(pageIndex);

            PDPageContentStream contentStream = new PDPageContentStream(
                    pdf, page, PDPageContentStream.AppendMode.APPEND, true, true);

            contentStream.setFont(
                    new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
            contentStream.setNonStrokingColor(0f, 0f, 1f);

            float pdfY = page.getMediaBox().getHeight() - sig.getY();

            contentStream.beginText();
            contentStream.newLineAtOffset(sig.getX(), pdfY);
            contentStream.showText("Signed by: " + sig.getSigner().getName());
            contentStream.endText();
            contentStream.close();
        }

        String signedPath = "uploads/signed_" + document.getFileName();
        pdf.save(signedPath);
        pdf.close();

        document.setStatus("SIGNED");
        document.setFilePath(signedPath);
        documentRepository.save(document);

        return signedPath;
    }
}