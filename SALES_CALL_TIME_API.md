# SalesCallTime API Documentation

## Overview
The SalesCallTime API provides endpoints for managing sales call time records. This API allows sales representatives to create and update call time entries for customer interactions.

## Base URL
```
/sales
```

## Authentication
All endpoints require authentication with a valid JWT token and the `SALES` role.

## Endpoints

### 1. Create Sales Call Time
**POST** `/sales-call-time`

Creates a new sales call time record.

#### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Request Body
```json
{
  "customer_number": 12345,
  "salesRepNumber": 67890,
  "webUserId": 11111,
  "time": "2024-01-15T10:30:00.000Z"
}
```

#### Request Body Schema
- `customer_number` (required): Integer - The customer number
- `salesRepNumber` (required): Integer - The sales representative number
- `webUserId` (optional): Integer - The web user ID (can be null)
- `time` (required): Date - The call time in ISO 8601 format

#### Response
**Success (200)**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "customer_number": 12345,
    "salesRepNumber": 67890,
    "webUserId": 11111,
    "time": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "customer_number",
      "message": "Customer number is required"
    }
  ]
}
```

### 2. Update Sales Call Time
**PUT** `/sales-call-time/:id`

Updates an existing sales call time record.

#### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### URL Parameters
- `id`: Integer - The ID of the sales call time record to update

#### Request Body
```json
{
  "time": "2024-01-15T11:00:00.000Z",
  "webUserId": 22222
}
```

#### Request Body Schema
All fields are optional for updates:
- `customer_number`: Integer - The customer number
- `salesRepNumber`: Integer - The sales representative number
- `webUserId`: Integer - The web user ID (can be null)
- `time`: Date - The call time in ISO 8601 format

#### Response
**Success (200)**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "customer_number": 12345,
    "salesRepNumber": 67890,
    "webUserId": 22222,
    "time": "2024-01-15T11:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Not Found (404)**
```json
{
  "success": false,
  "message": "Sales call time not found"
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "time",
      "message": "Time must be a valid date"
    }
  ]
}
```

## Error Handling

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad Request (Validation Error)
- **401**: Unauthorized (Invalid or missing token)
- **403**: Forbidden (Insufficient role permissions)
- **404**: Not Found (Record not found)
- **500**: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Specific error message"
    }
  ]
}
```

## Validation Rules

### Create Schema
- `customer_number`: Required, positive integer
- `salesRepNumber`: Required, positive integer
- `webUserId`: Optional, positive integer or null
- `time`: Required, valid date

### Update Schema
- All fields are optional
- If provided, fields must meet the same validation rules as create

## Database Schema

The SalesCallTime model includes the following fields:
- `id`: Primary key, auto-incrementing integer
- `customer_number`: Customer number (required)
- `salesRepNumber`: Sales representative number (required)
- `webUserId`: Web user ID (optional, nullable)
- `time`: Call time (required, maps to "Time" column)
- `createdAt`: Record creation timestamp
- `updatedAt`: Record last update timestamp

## Security

- **Authentication**: JWT token required
- **Authorization**: SALES role required
- **Input Validation**: All inputs are validated using Joi schemas
- **SQL Injection Protection**: Uses Sequelize ORM with parameterized queries

## Rate Limiting
No specific rate limiting is implemented for these endpoints.

## Examples

### Creating a Sales Call Time
```bash
curl -X POST http://localhost:3000/sales/sales-call-time \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_number": 12345,
    "salesRepNumber": 67890,
    "time": "2024-01-15T10:30:00.000Z"
  }'
```

### Updating a Sales Call Time
```bash
curl -X PUT http://localhost:3000/sales/sales-call-time/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "time": "2024-01-15T11:00:00.000Z"
  }'
```

## Notes

- The `time` field maps to the "Time" column in the database
- All timestamps are stored in UTC format
- The API automatically handles `createdAt` and `updatedAt` fields
- Partial updates are supported - only provided fields will be updated
