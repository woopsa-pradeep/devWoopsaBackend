# Sales Notes API Documentation

## Overview
The Sales Notes API provides CRUD operations for managing sales notes associated with customers. Sales notes allow sales representatives to maintain important information about their customers.

## Base URL
```
/sales
```

## Authentication
All endpoints require authentication with a valid JWT token and the `SALES` role.

## Endpoints

### 1. Create Sales Note
**POST** `/sales-notes/:customerId`

Creates a new sales note for a specific customer.

**Parameters:**
- `customerId` (path): The customer number

**Request Body:**
```json
{
  "note": "Customer prefers delivery in the morning",
  "isActive": true
}
```

**Validation Rules:**
- `note`: Required, string, 1-1000 characters
- `isActive`: Optional, boolean

**Response (201):**
```json
{
  "success": true,
  "data": {
    "salesId": 1,
    "CustomerNumber": 12345,
    "note": "Customer prefers delivery in the morning",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Sales note created successfully"
}
```

### 2. Get All Sales Notes (Paginated)
**GET** `/sales-notes/:customerId`

Retrieves all sales notes for a specific customer with pagination and search functionality.

**Parameters:**
- `customerId` (path): The customer number

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for filtering notes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCount": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "data": [
      {
        "salesId": 1,
        "CustomerNumber": 12345,
        "note": "Customer prefers delivery in the morning",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "message": "Success"
}
```

### 3. Get Sales Note by ID
**GET** `/sales-notes/:customerId/:salesId`

Retrieves a specific sales note by its ID.

**Parameters:**
- `customerId` (path): The customer number
- `salesId` (path): The sales note ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "salesId": 1,
    "CustomerNumber": 12345,
    "note": "Customer prefers delivery in the morning",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Success"
}
```

### 4. Update Sales Note
**PUT** `/sales-notes/:salesId`

Updates an existing sales note.

**Parameters:**
- `salesId` (path): The sales note ID

**Request Body:**
```json
{
  "note": "Updated note content",
  "isActive": false
}
```

**Validation Rules:**
- `note`: Optional, string, 1-1000 characters
- `isActive`: Optional, boolean

**Response (200):**
```json
{
  "success": true,
  "data": {
    "salesId": 1,
    "CustomerNumber": 12345,
    "note": "Updated note content",
    "isActive": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Sales note updated successfully"
}
```

### 5. Delete Sales Note
**DELETE** `/sales-notes/:salesId`

Soft deletes a sales note by setting `isActive` to false.

**Parameters:**
- `salesId` (path): The sales note ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Sales note deleted successfully"
  },
  "message": "Sales note deleted successfully"
}
```

### 6. Get All Sales Notes for Customer (Non-paginated)
**GET** `/sales-notes-customer/:customerId`

Retrieves all active sales notes for a specific customer without pagination.

**Parameters:**
- `customerId` (path): The customer number

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "salesId": 1,
      "CustomerNumber": 12345,
      "note": "Customer prefers delivery in the morning",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "message": "Success"
}
```

## Error Responses

### 404 - Not Found
```json
{
  "success": false,
  "data": null,
  "message": "Sales note not found"
}
```

### 400 - Bad Request
```json
{
  "success": false,
  "data": null,
  "message": "Note cannot be empty"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "data": null,
  "message": "Unauthorized"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "data": null,
  "message": "Access denied"
}
```

## Data Model

### SalesNote Interface
```typescript
interface ISalesNote {
  salesId: number;           // Primary key, auto-increment
  CustomerNumber: number;     // Customer number (required)
  isActive: boolean;          // Active status (default: true)
  note?: string | null;       // Note content (optional)
  createdAt: Date;            // Creation timestamp
  updatedAt: Date;            // Last update timestamp
}
```

## Database Schema

### Table: `sales_notes`
- `salesId` - INTEGER, PRIMARY KEY, AUTO_INCREMENT
- `CustomerNumber` - INTEGER, NOT NULL
- `isActive` - BOOLEAN, NOT NULL, DEFAULT true
- `note` - TEXT, NULLABLE
- `createdAt` - TIMESTAMP, NOT NULL
- `updatedAt` - TIMESTAMP, NOT NULL

### Indexes
- `CustomerNumber` - For efficient customer-based queries
- `isActive` - For filtering active/inactive notes

## Usage Examples

### Creating a note for a customer
```bash
curl -X POST \
  http://localhost:3000/sales/sales-notes/12345 \
  -H 'Authorization: Bearer <JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "note": "Customer prefers morning deliveries and has a dog in the backyard"
  }'
```

### Searching notes for a customer
```bash
curl -X GET \
  'http://localhost:3000/sales/sales-notes/12345?search=delivery&page=1&limit=5' \
  -H 'Authorization: Bearer <JWT_TOKEN>'
```

### Updating a note
```bash
curl -X PUT \
  http://localhost:3000/sales/sales-notes/1 \
  -H 'Authorization: Bearer <JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "note": "Updated: Customer prefers morning deliveries and has a dog in the backyard"
  }'
```

## Notes
- All notes are soft-deleted (isActive set to false) rather than hard-deleted
- Notes are automatically timestamped with creation and update times
- Search functionality works on the note content field
- Pagination is available for the main listing endpoint
- All operations require an active sales session for the customer
