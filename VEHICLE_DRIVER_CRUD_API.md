# Vehicle and Driver CRUD API Documentation

This document describes the CRUD (Create, Read, Update, Delete) operations for the Vehicle and Driver models.

## Table of Contents
1. [Vehicle API](#vehicle-api)
2. [Driver API](#driver-api)
3. [Authentication](#authentication)
4. [Error Responses](#error-responses)

---

## Authentication

All endpoints require authentication with a valid JWT token and either `MANAGER` or `SALES` role access.

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Vehicle API

### Base URL
```
/api/manager/vehicles
```

### Vehicle Model Structure

```typescript
{
  id: number;                          // Auto-incremented, primary key
  description: string | null;          // Vehicle description
  loadCapacityLbs: number | null;      // Load capacity in pounds
  truckType: string | null;            // Type of truck (e.g., Sprinter)
  licenseRegistrationNumber: string | null;  // License/registration number
  vinNumber: string | null;            // Vehicle Identification Number
  engineType: 'gasoline' | 'electric' | 'diesel' | null;
  lastServiceDate: Date | null;        // Last service date (YYYY-MM-DD)
  lastOilChangeDate: Date | null;     // Last oil change date (YYYY-MM-DD)
  nextOilChangeAfterMonths: number | null;  // Months until next oil change (1,2,3,6,12)
  mileageHours: number | null;         // Current mileage or hours (decimal)
  insurancePolicyNumber: string | null;
  insuranceCarrier: string | null;
  insuranceExpirationDate: Date | null;  // Insurance expiration (YYYY-MM-DD)
  conditionStatus: string | null;      // e.g., "Good", "Needs Repair"
  physicalNotes: string | null;       // Physical condition notes
  isActive: boolean;                   // Active status (default: true)
  createdAt: Date;                     // Auto-generated
  updatedAt: Date;                     // Auto-generated
}
```

---

### 1. Create Vehicle

**POST** `/api/manager/vehicles`

Creates a new vehicle record.

**Request Body:**
```json
{
  "description": "Delivery Truck #1",
  "loadCapacityLbs": 3000,
  "truckType": "Sprinter",
  "licenseRegistrationNumber": "ABC-1234",
  "vinNumber": "1HGBH41JXMN109186",
  "engineType": "diesel",
  "lastServiceDate": "2024-01-15",
  "lastOilChangeDate": "2024-01-10",
  "nextOilChangeAfterMonths": 6,
  "mileageHours": 45000.50,
  "insurancePolicyNumber": "POL-123456",
  "insuranceCarrier": "ABC Insurance",
  "insuranceExpirationDate": "2024-12-31",
  "conditionStatus": "Good",
  "physicalNotes": "Minor scratches on rear bumper",
  "isActive": true
}
```

**Validation Rules:**
- All fields are optional except `isActive` (defaults to `true`)
- `loadCapacityLbs`: Must be a positive integer if provided
- `nextOilChangeAfterMonths`: Must be a positive integer if provided
- `mileageHours`: Must be a positive number if provided
- `engineType`: Must be one of: `'gasoline'`, `'electric'`, `'diesel'` if provided
- `lastServiceDate`, `lastOilChangeDate`, `insuranceExpirationDate`: Must be in ISO format (YYYY-MM-DD) if provided
- `vinNumber`: Must be unique if provided (will throw error if duplicate)
- `licenseRegistrationNumber`: Must be unique if provided (will throw error if duplicate)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Delivery Truck #1",
    "loadCapacityLbs": 3000,
    "truckType": "Sprinter",
    "licenseRegistrationNumber": "ABC-1234",
    "vinNumber": "1HGBH41JXMN109186",
    "engineType": "diesel",
    "lastServiceDate": "2024-01-15",
    "lastOilChangeDate": "2024-01-10",
    "nextOilChangeAfterMonths": 6,
    "mileageHours": "45000.50",
    "insurancePolicyNumber": "POL-123456",
    "insuranceCarrier": "ABC Insurance",
    "insuranceExpirationDate": "2024-12-31",
    "conditionStatus": "Good",
    "physicalNotes": "Minor scratches on rear bumper",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  },
  "message": "Vehicle created successfully"
}
```

**Error Responses:**
- `400`: Vehicle with this VIN number already exists
- `400`: Vehicle with this license registration number already exists
- `400`: Validation error

---

### 2. Get All Vehicles

**GET** `/api/manager/vehicles`

Retrieves a paginated list of vehicles with optional search and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)
- `search` (optional): Search term (searches in: description, truckType, licenseRegistrationNumber, vinNumber, insurancePolicyNumber, insuranceCarrier)
- `isActive` (optional): Filter by active status (true/false)

**Example Request:**
```
GET /api/manager/vehicles?page=1&limit=20&search=Sprinter&isActive=true
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCount": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "vehicles": [
      {
        "id": 1,
        "description": "Delivery Truck #1",
        "loadCapacityLbs": 3000,
        "truckType": "Sprinter",
        "licenseRegistrationNumber": "ABC-1234",
        "vinNumber": "1HGBH41JXMN109186",
        "engineType": "diesel",
        "lastServiceDate": "2024-01-15",
        "lastOilChangeDate": "2024-01-10",
        "nextOilChangeAfterMonths": 6,
        "mileageHours": "45000.50",
        "insurancePolicyNumber": "POL-123456",
        "insuranceCarrier": "ABC Insurance",
        "insuranceExpirationDate": "2024-12-31",
        "conditionStatus": "Good",
        "physicalNotes": "Minor scratches on rear bumper",
        "isActive": true,
        "createdAt": "2024-01-20T10:30:00.000Z",
        "updatedAt": "2024-01-20T10:30:00.000Z"
      }
    ]
  },
  "message": "Vehicles retrieved successfully"
}
```

---

### 3. Get Vehicle by ID

**GET** `/api/manager/vehicles/:id`

Retrieves a single vehicle by its ID.

**Path Parameters:**
- `id` (required): Vehicle ID

**Example Request:**
```
GET /api/manager/vehicles/1
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Delivery Truck #1",
    "loadCapacityLbs": 3000,
    "truckType": "Sprinter",
    "licenseRegistrationNumber": "ABC-1234",
    "vinNumber": "1HGBH41JXMN109186",
    "engineType": "diesel",
    "lastServiceDate": "2024-01-15",
    "lastOilChangeDate": "2024-01-10",
    "nextOilChangeAfterMonths": 6,
    "mileageHours": "45000.50",
    "insurancePolicyNumber": "POL-123456",
    "insuranceCarrier": "ABC Insurance",
    "insuranceExpirationDate": "2024-12-31",
    "conditionStatus": "Good",
    "physicalNotes": "Minor scratches on rear bumper",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  },
  "message": "Vehicle retrieved successfully"
}
```

**Error Responses:**
- `404`: Vehicle not found

---

### 4. Update Vehicle

**PUT** `/api/manager/vehicles/:id`

Updates an existing vehicle record.

**Path Parameters:**
- `id` (required): Vehicle ID

**Request Body:**
All fields are optional. Only include fields you want to update.

```json
{
  "description": "Updated Delivery Truck #1",
  "mileageHours": 46000.75,
  "conditionStatus": "Needs Repair",
  "physicalNotes": "Updated notes",
  "isActive": false
}
```

**Validation Rules:**
- Same validation rules as Create Vehicle
- `vinNumber`: Must be unique if provided (will throw error if duplicate and different from current)
- `licenseRegistrationNumber`: Must be unique if provided (will throw error if duplicate and different from current)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Updated Delivery Truck #1",
    "loadCapacityLbs": 3000,
    "truckType": "Sprinter",
    "licenseRegistrationNumber": "ABC-1234",
    "vinNumber": "1HGBH41JXMN109186",
    "engineType": "diesel",
    "lastServiceDate": "2024-01-15",
    "lastOilChangeDate": "2024-01-10",
    "nextOilChangeAfterMonths": 6,
    "mileageHours": "46000.75",
    "insurancePolicyNumber": "POL-123456",
    "insuranceCarrier": "ABC Insurance",
    "insuranceExpirationDate": "2024-12-31",
    "conditionStatus": "Needs Repair",
    "physicalNotes": "Updated notes",
    "isActive": false,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  },
  "message": "Vehicle updated successfully"
}
```

**Error Responses:**
- `404`: Vehicle not found
- `400`: Vehicle with this VIN number already exists
- `400`: Vehicle with this license registration number already exists
- `400`: Validation error

---

### 5. Delete Vehicle

**DELETE** `/api/manager/vehicles/:id`

Deletes a vehicle record.

**Path Parameters:**
- `id` (required): Vehicle ID

**Example Request:**
```
DELETE /api/manager/vehicles/1
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Vehicle deleted successfully"
  },
  "message": "Vehicle deleted successfully"
}
```

**Error Responses:**
- `404`: Vehicle not found

---

## Driver API

### Base URL
```
/api/manager/drivers
```

### Driver Model Structure

```typescript
{
  id: number;                          // Auto-incremented, primary key
  firstName: string;                   // Required
  lastName: string;                    // Required
  email: string;                       // Required, unique, valid email
  password: string;                    // Required (hashed before storage)
  isActive: boolean;                   // Active status (default: true)
  currentLatitude: number | null;      // Current GPS latitude (-90 to 90)
  currentLongitude: number | null;     // Current GPS longitude (-180 to 180)
  driverLicenseNo: string | null;     // Driver license number
  licenseExpirationDate: Date | null;  // License expiration date (YYYY-MM-DD)
  licenseClass: 'A' | 'B' | 'C' | 'D' | null;  // License class
  driverPicture: string | null;        // Driver picture URL/path
  dotMedicalCertificate: string | null;  // DOT medical certificate URL/path
  createdAt: Date;                     // Auto-generated
  updatedAt: Date;                     // Auto-generated
}
```

---

### 1. Create Driver

**POST** `/api/manager/drivers`

Creates a new driver record.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "driverLicenseNo": "DL123456",
  "licenseExpirationDate": "2025-12-31",
  "licenseClass": "A",
  "driverPicture": "https://example.com/driver-pictures/john-doe.jpg",
  "dotMedicalCertificate": "https://example.com/certificates/john-doe-medical.pdf",
  "currentLatitude": 40.7128,
  "currentLongitude": -74.0060,
  "isActive": true
}
```

**Validation Rules:**
- `firstName`: Required, string, cannot be empty
- `lastName`: Required, string, cannot be empty
- `email`: Required, valid email format, must be unique
- `password`: Required, string, cannot be empty (will be hashed before storage)
- `driverLicenseNo`: Optional, string
- `licenseExpirationDate`: Optional, valid date
- `licenseClass`: Optional, must be one of: `'A'`, `'B'`, `'C'`, `'D'` if provided
- `driverPicture`: Optional, string (file path or URL)
- `dotMedicalCertificate`: Optional, string (file path or URL)
- `currentLatitude`: Optional, number between -90 and 90
- `currentLongitude`: Optional, number between -180 and 180
- `isActive`: Optional, boolean (defaults to `true`)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "$2b$10$hashedPassword...",
    "driverLicenseNo": "DL123456",
    "licenseExpirationDate": "2025-12-31",
    "licenseClass": "A",
    "driverPicture": "https://example.com/driver-pictures/john-doe.jpg",
    "dotMedicalCertificate": "https://example.com/certificates/john-doe-medical.pdf",
    "currentLatitude": "40.71280000",
    "currentLongitude": "-74.00600000",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  },
  "message": "Driver created successfully"
}
```

**Error Responses:**
- `400`: Driver with this email already exists
- `400`: Validation error

---

### 2. Get All Drivers

**GET** `/api/manager/drivers`

Retrieves a paginated list of drivers with optional search functionality.

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)
- `search` (optional): Search term (searches in: firstName, lastName, email)

**Example Request:**
```
GET /api/manager/drivers?page=1&limit=20&search=John
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCount": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "drivers": [
      {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "password": "$2b$10$hashedPassword...",
        "driverLicenseNo": "DL123456",
        "licenseExpirationDate": "2025-12-31",
        "licenseClass": "A",
        "driverPicture": "https://example.com/driver-pictures/john-doe.jpg",
        "dotMedicalCertificate": "https://example.com/certificates/john-doe-medical.pdf",
        "currentLatitude": "40.71280000",
        "currentLongitude": "-74.00600000",
        "isActive": true,
        "createdAt": "2024-01-20T10:30:00.000Z",
        "updatedAt": "2024-01-20T10:30:00.000Z"
      }
    ]
  },
  "message": "Drivers retrieved successfully"
}
```

---

### 3. Get Driver by ID

**GET** `/api/manager/drivers/:id`

Retrieves a single driver by their ID.

**Path Parameters:**
- `id` (required): Driver ID

**Example Request:**
```
GET /api/manager/drivers/1
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "$2b$10$hashedPassword...",
    "driverLicenseNo": "DL123456",
    "licenseExpirationDate": "2025-12-31",
    "licenseClass": "A",
    "driverPicture": "https://example.com/driver-pictures/john-doe.jpg",
    "dotMedicalCertificate": "https://example.com/certificates/john-doe-medical.pdf",
    "currentLatitude": "40.71280000",
    "currentLongitude": "-74.00600000",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  },
  "message": "Driver retrieved successfully"
}
```

**Error Responses:**
- `404`: Driver not found

---

### 4. Update Driver

**PUT** `/api/manager/drivers/:id`

Updates an existing driver record.

**Path Parameters:**
- `id` (required): Driver ID

**Request Body:**
All fields are optional. Only include fields you want to update.

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "currentLatitude": 40.7580,
  "currentLongitude": -73.9855,
  "isActive": false
}
```

**Validation Rules:**
- `firstName`: Optional, string, cannot be empty if provided
- `lastName`: Optional, string, cannot be empty if provided
- `email`: Optional, valid email format, must be unique if different from current email
- `currentLatitude`: Optional, number between -90 and 90
- `currentLongitude`: Optional, number between -180 and 180

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "password": "$2b$10$hashedPassword...",
    "driverLicenseNo": "DL123456",
    "licenseExpirationDate": "2025-12-31",
    "licenseClass": "A",
    "driverPicture": "https://example.com/driver-pictures/john-doe.jpg",
    "dotMedicalCertificate": "https://example.com/certificates/john-doe-medical.pdf",
    "currentLatitude": "40.75800000",
    "currentLongitude": "-73.98550000",
    "isActive": false,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  },
  "message": "Driver updated successfully"
}
```

**Error Responses:**
- `404`: Driver not found
- `400`: Driver with this email already exists
- `400`: Validation error

---

### 5. Delete Driver

**DELETE** `/api/manager/drivers/:id`

Deletes a driver record.

**Path Parameters:**
- `id` (required): Driver ID

**Example Request:**
```
DELETE /api/manager/drivers/1
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Driver deleted successfully"
  },
  "message": "Driver deleted successfully"
}
```

**Error Responses:**
- `404`: Driver not found

---

### 6. Update Driver Location

**PUT** `/api/manager/drivers/:id/location`

Updates a driver's current GPS location.

**Path Parameters:**
- `id` (required): Driver ID

**Request Body:**
```json
{
  "currentLatitude": 40.7580,
  "currentLongitude": -73.9855
}
```

**Validation Rules:**
- `currentLatitude`: Required, number between -90 and 90
- `currentLongitude`: Required, number between -180 and 180

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "$2b$10$hashedPassword...",
    "driverLicenseNo": "DL123456",
    "licenseExpirationDate": "2025-12-31",
    "licenseClass": "A",
    "driverPicture": "https://example.com/driver-pictures/john-doe.jpg",
    "dotMedicalCertificate": "https://example.com/certificates/john-doe-medical.pdf",
    "currentLatitude": "40.75800000",
    "currentLongitude": "-73.98550000",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  },
  "message": "Driver location updated successfully"
}
```

**Error Responses:**
- `404`: Driver not found
- `400`: Validation error

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Vehicle not found"
}
```
or
```json
{
  "success": false,
  "message": "Driver not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Notes

1. **Password Security**: Driver passwords are automatically hashed using bcrypt before storage. Never return the plain password in responses.

2. **Unique Constraints**:
   - Vehicle: `vinNumber` and `licenseRegistrationNumber` must be unique
   - Driver: `email` must be unique

3. **Date Formats**: All date fields should be provided in ISO format (YYYY-MM-DD).

4. **Pagination**: The default pagination is 10 items per page with a maximum of 100 items per page.

5. **Search Functionality**: 
   - Vehicle search searches across: description, truckType, licenseRegistrationNumber, vinNumber, insurancePolicyNumber, insuranceCarrier
   - Driver search searches across: firstName, lastName, email

6. **Sorting**: Results are sorted by `createdAt` in descending order (newest first).
