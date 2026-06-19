# DocSign — Document Signature App

A DocuSign-like digital signature platform built with Java Spring Boot and React.

## Tech Stack
- **Backend:** Java 17, Spring Boot, Spring Security, JWT, PostgreSQL, Apache PDFBox
- **Frontend:** React, Tailwind CSS, react-pdf
- **Database:** PostgreSQL

## Features
- JWT-based user authentication (Register/Login)
- PDF document upload and management
- Digital signature placement with drag & drop
- Multiple font styles and colors for signatures
- Optional fields: Name, Date, Text, Company Stamp
- Generate signed PDF with embedded signatures
- Token-based public signing links
- Audit trail for all document actions
- Download signed PDF

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Documents
- POST /api/documents/upload
- GET /api/documents/my
- GET /api/documents/download/{id}

### Signatures
- POST /api/signatures
- GET /api/signatures/{documentId}
- POST /api/signatures/finalize/{documentId}

### Signing Links
- POST /api/documents/{id}/send-link
- GET /api/documents/public/{token}

### Audit
- GET /api/audit/{documentId}

## Setup Instructions

### Backend
1. Install Java 17+ and PostgreSQL
2. Create database: `CREATE DATABASE signdoc;`
3. Update `application.properties` with your DB credentials
4. Run: `./mvnw spring-boot:run`
5. Backend runs on port 8081

### Frontend
1. Install Node.js
2. `cd frontend && npm install`
3. `npm run dev`
4. Frontend runs on port 5173

## Test Credentials
- Email: sakshi@test.com
- Password: 123456

## Project Structure
```
sign-document-project/
├── backend/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── model/
│   ├── security/
│   └── dto/
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        └── services/
```