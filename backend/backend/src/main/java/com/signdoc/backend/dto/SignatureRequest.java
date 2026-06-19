package com.signdoc.backend.dto;

import lombok.Data;

@Data
public class SignatureRequest {
    private Long documentId;
    private Float x;
    private Float y;
    private Integer page;
    private String signatureText;
    private String stampImageBase64;
}