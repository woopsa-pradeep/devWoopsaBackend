# Policies API Documentation

This document describes the CRUD API endpoints for managing Policies in the system.

## Overview

The Policies API allows managers to manage various policy documents including:
- Privacy Policies
- Terms and Conditions
- Software License
- Refund Policies

## Base URL

All endpoints are prefixed with `/manager` and require manager role authentication.

## Endpoints

### 1. Create Policies
**POST** `/manager/policies`

Creates new policies. Only one policies record can exist in the system.

**Request Body:**
```json
{
  "PrivacyPolicies": "Your privacy policy text here...",
  "TermsAndConditions": "Your terms and conditions text here...",
  "SoftwareLicense": "Your software license text here...",
  "RefundPolicies": "Your refund policy text here..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "PrivacyPolicies": "Your privacy policy text here...",
    "TermsAndConditions": "Your terms and conditions text here...",
    "SoftwareLicense": "Your software license text here...",
    "RefundPolicies": "Your refund policy text here..."
  },
  "message": "Policies created successfully"
}
```

### 2. Get Policies
**GET** `/manager/policies`

Retrieves the current policies.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "PrivacyPolicies": "Your privacy policy text here...",
    "TermsAndConditions": "Your terms and conditions text here...",
    "SoftwareLicense": "Your software license text here...",
    "RefundPolicies": "Your refund policy text here..."
  },
  "message": "Policies retrieved successfully"
}
```

### 3. Update Policies
**PUT** `/manager/policies`

Updates all policies fields. Only the fields you want to update need to be included.

**Request Body:**
```json
{
  "PrivacyPolicies": "Updated privacy policy text...",
  "TermsAndConditions": "Updated terms and conditions text..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "PrivacyPolicies": "Updated privacy policy text...",
    "TermsAndConditions": "Updated terms and conditions text...",
    "SoftwareLicense": "Your software license text here...",
    "RefundPolicies": "Your refund policy text here..."
  },
  "message": "Policies updated successfully"
}
```

### 4. Update Refund Policies Only
**PUT** `/manager/policies/refund`

Updates only the RefundPolicies field. This is a specialized endpoint for updating just refund policies.

**Request Body:**
```json
{
  "RefundPolicies": "Updated refund policy text..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "PrivacyPolicies": "Your privacy policy text here...",
    "TermsAndConditions": "Your terms and conditions text here...",
    "SoftwareLicense": "Your software license text here...",
    "RefundPolicies": "Updated refund policy text..."
  },
  "message": "Refund policies updated successfully"
}
```

### 5. Delete Policies
**DELETE** `/manager/policies`

Deletes the policies record.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Policies deleted successfully"
  },
  "message": "Policies deleted successfully"
}
```

## Authentication

All endpoints require:
- Valid JWT token in Authorization header
- Manager role permissions

**Header:**
```
Authorization: Bearer <your-jwt-token>
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Policies already exist. Use update instead."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Policies not found"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. Manager role required."
}
```

## Validation

The API includes validation for all input fields:

- **PrivacyPolicies**: Optional string
- **TermsAndConditions**: Optional string  
- **SoftwareLicense**: Optional string
- **RefundPolicies**: Required string (for refund-specific endpoint)

## Database Schema

The Policies model has the following structure:

```typescript
{
  id: number (Primary Key, Auto-increment),
  PrivacyPolicies: string (TEXT, nullable),
  TermsAndConditions: string (TEXT, nullable),
  SoftwareLicense: string (TEXT, nullable),
  RefundPolicies: string (TEXT, nullable)
}
```

## Notes

- Only one policies record can exist in the system at a time
- All text fields are stored as TEXT type to accommodate long content
- The system automatically handles the single-record constraint
- Updates are partial - only included fields will be updated
- The refund policies endpoint is specifically designed for quick updates to refund policies only
