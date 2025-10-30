# WebQuickLink CRUD API Documentation

## Overview
The WebQuickLink API provides full CRUD (Create, Read, Update, Delete) operations for managing web quick links. This API is designed for managers to create and manage quick access links for the web interface.

## Base URL
```
POST /api/manager/web-quick-links
GET /api/manager/web-quick-links
GET /api/manager/web-quick-links/:id
PUT /api/manager/web-quick-links/:id
DELETE /api/manager/web-quick-links/:id
```

## Authentication
All endpoints require authentication with a valid JWT token and manager role access.

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

## Endpoints

### 1. Create WebQuickLink
**POST** `/api/manager/web-quick-links`

**Request Body (multipart/form-data):**
```json
{
  "name": "string (required, max 100 chars)",
  "description": "string (optional, max 500 chars)",
  "image": "file (optional, image file)",
  "url": "string (optional, valid URI)",
  "status": "string (optional, max 50 chars)",
  "isActive": "boolean (optional, default: true)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Web quick link created successfully",
  "data": {
    "id": 1,
    "name": "Quick Link Name",
    "description": "Description text",
    "image": "https://azure-blob-url/image.jpg",
    "url": "https://example.com",
    "status": "active",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get All WebQuickLinks
**GET** `/api/manager/web-quick-links`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name or description

**Response (200):**
```json
{
  "success": true,
  "message": "Web quick links retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Quick Link 1",
        "description": "Description 1",
        "image": "https://azure-blob-url/image1.jpg",
        "url": "https://example1.com",
        "status": "active",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 3. Get WebQuickLink by ID
**GET** `/api/manager/web-quick-links/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Web quick link retrieved successfully",
  "data": {
    "id": 1,
    "name": "Quick Link Name",
    "description": "Description text",
    "image": "https://azure-blob-url/image.jpg",
    "url": "https://example.com",
    "status": "active",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Update WebQuickLink
**PUT** `/api/manager/web-quick-links/:id`

**Request Body (multipart/form-data):**
```json
{
  "name": "string (optional, max 100 chars)",
  "description": "string (optional, max 500 chars)",
  "image": "file (optional, image file)",
  "url": "string (optional, valid URI)",
  "status": "string (optional, max 50 chars)",
  "isActive": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Web quick link updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Quick Link Name",
    "description": "Updated description",
    "image": "https://azure-blob-url/new-image.jpg",
    "url": "https://updated-example.com",
    "status": "inactive",
    "isActive": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Delete WebQuickLink
**DELETE** `/api/manager/web-quick-links/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Web quick link deleted successfully",
  "data": {
    "message": "Web quick link deleted successfully"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Web quick link not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Features

### Image Upload
- Supports image file uploads via multipart/form-data
- Images are automatically uploaded to Azure Blob Storage
- Image URL is stored in the database after successful upload

### Search Functionality
- Search by name or description using case-insensitive pattern matching
- Supports partial text search

### Pagination
- Configurable page size and page number
- Returns total count and total pages for pagination UI

### Soft Delete
- Records are not physically deleted from the database
- `isActive` field is set to `false` when deleting
- Only active records are returned in list operations

## Validation Rules

### Name
- Required field
- Maximum 100 characters
- Cannot be empty string

### Description
- Optional field
- Maximum 500 characters
- Can be null or empty string

### Image
- Optional field
- Must be a valid image file when provided
- Automatically uploaded to Azure Blob Storage

### URL
- Optional field
- Must be a valid URI format when provided
- Can be null or empty string

### Status
- Optional field
- Maximum 50 characters
- Can be null or empty string

### isActive
- Optional field
- Boolean value
- Defaults to `true` for new records

## Usage Examples

### Create a new quick link
```bash
curl -X POST /api/manager/web-quick-links \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=Product Catalog" \
  -F "description=Quick access to product catalog" \
  -F "url=https://products.example.com" \
  -F "status=active" \
  -F "image=@/path/to/image.jpg"
```

### Search for quick links
```bash
curl -X GET "/api/manager/web-quick-links?search=catalog&page=1&limit=5" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Update a quick link
```bash
curl -X PUT /api/manager/web-quick-links/1 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=Updated Product Catalog" \
  -F "status=inactive"
```

### Delete a quick link
```bash
curl -X DELETE /api/manager/web-quick-links/1 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Notes

1. **File Upload**: When updating an existing record with a new image, the old image URL is replaced with the new one.

2. **Search**: The search functionality uses case-insensitive pattern matching on both name and description fields.

3. **Pagination**: The API returns pagination metadata to help build pagination UI components.

4. **Soft Delete**: Deleted records remain in the database but are marked as inactive, allowing for potential recovery if needed.

5. **Image Storage**: All images are stored in Azure Blob Storage under the 'webview' container for organization purposes.
