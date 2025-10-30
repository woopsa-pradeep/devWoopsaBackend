# Retailer Request API Documentation

This document describes the CRUD API endpoints for managing retailer requests in the WebAppBackend system.

## Overview

The Retailer Request API allows managers to create, read, update, and delete retailer account requests. Each request contains comprehensive business information including business details, contact information, addresses, licensing, ownership details, and references.

## Base URL

```
/manager/retailer-requests
```

## Authentication

All endpoints require manager role authentication using the `verifyRole(ROLES.MANAGER)` middleware.

## Endpoints

### 1. Create Retailer Request

**POST** `/manager/retailer-requests`

Creates a new retailer request.

**Request Body:**
```json
{
  "business_name": "string (required)",
  "dba_name": "string (optional)",
  "business_type": "SOLE_PROP | PARTNERSHIP | LLC | CORP | OTHER (required)",
  "federal_ein": "string (optional, max 15 chars)",
  "ownership_type": "string (optional)",
  "primary_contact": "string (required)",
  "phone": "string (optional)",
  "email": "string (optional, valid email)",
  "website": "string (optional, valid URL)",
  "physical_street": "string (required)",
  "physical_city": "string (required)",
  "physical_state": "string (required, 2 chars)",
  "physical_zip": "string (required)",
  "physical_county": "string (optional)",
  "mailing_same_as_physical": "boolean (default: true)",
  "mailing_street": "string (optional)",
  "mailing_city": "string (optional)",
  "mailing_state": "string (optional, 2 chars)",
  "mailing_zip": "string (optional)",
  "sales_tax_id": "string (optional)",
  "state_tobacco_license": "string (optional)",
  "federal_tobacco_permit": "string (optional)",
  "resale_certificate_url": "string (optional, valid URL)",
  "state_tobacco_license_url": "string (optional, valid URL)",
  "business_license_url": "string (optional, valid URL)",
  "owner_government_id_url": "string (optional, valid URL)",
  "owners": [
    {
      "fullName": "string (required)",
      "title": "string (optional)",
      "ownership": "number (optional, 0-100)",
      "dateOfBirth": "string (optional, ISO date)",
      "email": "string (optional, valid email)",
      "homeAddress": "string (optional)",
      "phone": "string (optional)"
    }
  ],
  "credit_limit_requested": "boolean (default: false)",
  "bank_name": "string (optional)",
  "bank_account_last4": "string (optional, 4 chars)",
  "references": [
    {
      "company": "string (required)",
      "contact": "string (optional)",
      "phone": "string (optional)",
      "email": "string (optional, valid email)"
    }
  ],
  "notes": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "business_name": "string",
    "status": "PENDING",
    "created_at": "date",
    "updated_at": "date"
    // ... other fields
  },
  "message": "Retailer request created successfully"
}
```

### 2. Get All Retailer Requests

**GET** `/manager/retailer-requests`

Retrieves a paginated list of retailer requests with optional filtering.

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 10, max: 100
- `search` (optional): Search in business name, contact, email, city, state
- `status` (optional): Filter by status (PENDING, REVIEW, APPROVED, REJECTED)
- `business_type` (optional): Filter by business type
- `credit_limit_requested` (optional): Filter by credit limit request

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "retailerRequests": [
      {
        "id": "uuid",
        "business_name": "string",
        "status": "string",
        // ... other fields
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "totalPages": "number"
    }
  },
  "message": "Retailer requests fetched successfully"
}
```

### 3. Get Retailer Request by ID

**GET** `/manager/retailer-requests/:id`

Retrieves a specific retailer request by its UUID.

**Path Parameters:**
- `id`: UUID of the retailer request

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "business_name": "string",
    "status": "string",
    // ... all fields
  },
  "message": "Retailer request fetched successfully"
}
```

### 4. Update Retailer Request

**PUT** `/manager/retailer-requests/:id`

Updates an existing retailer request. All fields are optional for updates.

**Path Parameters:**
- `id`: UUID of the retailer request

**Request Body:** Same as create, but all fields are optional.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "business_name": "string",
    "status": "string",
    // ... updated fields
  },
  "message": "Retailer request updated successfully"
}
```

### 5. Delete Retailer Request

**DELETE** `/manager/retailer-requests/:id`

Deletes a retailer request permanently.

**Path Parameters:**
- `id`: UUID of the retailer request

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Retailer request deleted successfully"
  },
  "message": "Retailer request deleted successfully"
}
```

### 6. Update Retailer Request Status

**PATCH** `/manager/retailer-requests/:id/status`

Updates the status of a retailer request and optionally adds notes.

**Path Parameters:**
- `id`: UUID of the retailer request

**Request Body:**
```json
{
  "status": "PENDING | REVIEW | APPROVED | REJECTED (required)",
  "notes": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "string",
    "notes": "string",
    // ... other fields
  },
  "message": "Retailer request status updated successfully"
}
```

## Status Values

- `PENDING`: Initial status when request is created
- `REVIEW`: Request is under review by management
- `APPROVED`: Request has been approved
- `REJECTED`: Request has been rejected

## Business Types

- `SOLE_PROP`: Sole Proprietorship
- `PARTNERSHIP`: Partnership
- `LLC`: Limited Liability Company
- `CORP`: Corporation
- `OTHER`: Other business structure

## Validation Rules

- Business name, primary contact, physical address fields are required
- Email fields must be valid email addresses
- Website and URL fields must be valid URLs
- State fields must be exactly 2 characters
- Bank account last 4 digits must be exactly 4 characters
- Ownership percentage must be between 0 and 100
- Date of birth must be in ISO format (YYYY-MM-DD)
- Owners array must have at least one owner with required fullName
- References array must have at least one reference with required company

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error details",
  "errors": ["array of validation errors"]
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Retailer request not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to create retailer request"
}
```

## Example Usage

### Creating a Retailer Request
```bash
curl -X POST /manager/retailer-requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "ABC Convenience Store",
    "business_type": "LLC",
    "primary_contact": "John Doe",
    "physical_street": "123 Main St",
    "physical_city": "Anytown",
    "physical_state": "CA",
    "physical_zip": "12345",
    "owners": [
      {
        "fullName": "John Doe",
        "title": "Owner",
        "ownership": 100
      }
    ],
    "references": [
      {
        "company": "XYZ Supplier",
        "contact": "Jane Smith",
        "phone": "555-1234"
      }
    ]
  }'
```

### Getting All Requests with Filtering
```bash
curl -X GET "/manager/retailer-requests?status=PENDING&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Updating Status
```bash
curl -X PATCH /manager/retailer-requests/<uuid>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "notes": "All documentation verified and approved"
  }'
```

## Notes

- The API automatically generates UUIDs for new requests
- Timestamps (created_at, updated_at) are automatically managed
- The mailing address fields are optional if mailing_same_as_physical is true
- Bank account information is encrypted before storage
- All URL fields should point to uploaded documents
- The API supports soft deletion (status updates) rather than hard deletion for audit purposes

