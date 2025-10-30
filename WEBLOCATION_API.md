# WebLocation API Documentation

This document describes the CRUD (Create, Read, Update, Delete) operations for the WebLocation model.

## Base URL
```
/api/manager/web-locations
```

## Authentication
All endpoints require manager role authentication. Include the authorization token in the request header:
```
Authorization: Bearer <your-token>
```

## Endpoints

### 1. Create WebLocation
**POST** `/api/manager/web-locations`

Creates a new web location with latitude and longitude coordinates.

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Validation Rules:**
- `latitude`: Required, number between -90 and 90
- `longitude`: Required, number between -180 and 180

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "latitude": "40.712800",
    "longitude": "-74.006000",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Web location created successfully"
}
```

### 2. Get All WebLocations
**GET** `/api/manager/web-locations`

Retrieves a paginated list of web locations with optional search functionality.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search term for latitude or longitude

**Example Request:**
```
GET /api/manager/web-locations?page=1&limit=20&search=40.7
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "latitude": "40.712800",
        "longitude": "-74.006000",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  },
  "message": "Web locations retrieved successfully"
}
```

### 3. Get WebLocation by ID
**GET** `/api/manager/web-locations/:id`

Retrieves a specific web location by its ID.

**Path Parameters:**
- `id`: WebLocation ID (number)

**Example Request:**
```
GET /api/manager/web-locations/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "latitude": "40.712800",
    "longitude": "-74.006000",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Web location retrieved successfully"
}
```

### 4. Update WebLocation
**PUT** `/api/manager/web-locations/:id`

Updates an existing web location.

**Path Parameters:**
- `id`: WebLocation ID (number)

**Request Body:**
```json
{
  "latitude": 40.7589,
  "longitude": -73.9851
}
```

**Validation Rules:**
- `latitude`: Optional, number between -90 and 90
- `longitude`: Optional, number between -180 and 180

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "latitude": "40.758900",
    "longitude": "-73.985100",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Web location updated successfully"
}
```

### 5. Delete WebLocation
**DELETE** `/api/manager/web-locations/:id`

Permanently deletes a web location.

**Path Parameters:**
- `id`: WebLocation ID (number)

**Example Request:**
```
DELETE /api/manager/web-locations/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Web location deleted successfully"
  },
  "message": "Web location deleted successfully"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "latitude",
      "message": "Latitude must be between -90 and 90"
    }
  ]
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Web location not found"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### Forbidden Error (403)
```json
{
  "success": false,
  "message": "Access denied. Manager role required."
}
```

## Data Model

The WebLocation model has the following structure:

```typescript
interface WebLocation {
  id: number;           // Auto-increment primary key
  latitude: number;     // Decimal(9,6) - precise to ~0.11m
  longitude: number;    // Decimal(9,6) - precise to ~0.11m
  createdAt: Date;      // Auto-generated timestamp
  updatedAt: Date;      // Auto-updated timestamp
}
```

## Coordinate Precision

- **Latitude**: Decimal(9,6) - Range: -90 to 90 degrees
- **Longitude**: Decimal(9,6) - Range: -180 to 180 degrees
- **Precision**: Approximately 0.11 meters (11 centimeters)

## Use Cases

1. **Store Management**: Track warehouse and store locations
2. **Delivery Routes**: Optimize delivery paths based on coordinates
3. **Customer Mapping**: Map customer locations for territory management
4. **Geographic Analytics**: Analyze sales patterns by location
5. **Mobile App Integration**: Provide location-based services

## Notes

- All coordinates are stored as decimal numbers for maximum precision
- The API automatically validates coordinate ranges
- Soft delete is not implemented - deletion is permanent
- Search functionality works on both latitude and longitude fields
- Pagination is implemented for efficient data retrieval
