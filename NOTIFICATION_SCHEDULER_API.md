# NotificationScheduler API Documentation

## Overview
The NotificationScheduler API provides comprehensive CRUD operations for managing scheduled notifications. This API allows managers to create, read, update, and delete notification schedules that will be sent to specific users at designated times.

## Base URL
```
/api/manager/notificationSchedulers
```

## Authentication
All endpoints require manager role authentication. Include the authorization token in the request headers:
```
Authorization: Bearer <your-token>
```

## API Endpoints

### 1. Create Notification Scheduler
**POST** `/api/manager/notificationSchedulers`

Creates a new scheduled notification.

**Request Body:**
```json
{
  "userId": [1, 2, 3],
  "title": "Important Update",
  "description": "Your order has been processed and is ready for delivery.",
  "date": "2024-01-15",
  "time": "10:30:00",
  "isActive": true
}
```

**Validation Rules:**
- `userId`: Array of positive integers (required, min 1 user)
- `title`: String, 1-255 characters (required)
- `description`: String, min 1 character (required)
- `date`: ISO date format, cannot be in the past (required)
- `time`: HH:MM:SS format (required)
- `isActive`: Boolean, defaults to true (optional)

**Response:**
```json
{
  "success": true,
  "message": "Notification scheduler created successfully",
  "data": {
    "id": 1,
    "userId": [1, 2, 3],
    "title": "Important Update",
    "description": "Your order has been processed and is ready for delivery.",
    "date": "2024-01-15",
    "time": "10:30:00",
    "isActive": true,
    "isExpire": false,
    "created_at": "2024-01-10T10:00:00.000Z",
    "updated_at": "2024-01-10T10:00:00.000Z"
  }
}
```

### 2. Get All Notification Schedulers
**GET** `/api/manager/notificationSchedulers`

Retrieves a paginated list of notification schedulers with optional filtering.

**Query Parameters:**
- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 10, min: 1, max: 100)
- `search`: Search in title and description (optional)
- `isActive`: Filter by active status (optional)
- `isExpire`: Filter by expire status (optional)
- `date`: Filter by specific date (optional)

**Example Request:**
```
GET /api/manager/notificationSchedulers?page=1&limit=10&search=update&isActive=true
```

**Response:**
```json
{
  "success": true,
  "message": "Notification schedulers retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": 1,
        "userId": [1, 2, 3],
        "title": "Important Update",
        "description": "Your order has been processed.",
        "date": "2024-01-15",
        "time": "10:30:00",
        "isActive": true,
        "isExpire": false,
        "created_at": "2024-01-10T10:00:00.000Z",
        "updated_at": "2024-01-10T10:00:00.000Z"
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

### 3. Get Notification Scheduler by ID
**GET** `/api/manager/notificationSchedulers/:id`

Retrieves a specific notification scheduler by its ID.

**Path Parameters:**
- `id`: Notification scheduler ID (integer)

**Example Request:**
```
GET /api/manager/notificationSchedulers/1
```

**Response:**
```json
{
  "success": true,
  "message": "Notification scheduler retrieved successfully",
  "data": {
    "id": 1,
    "userId": [1, 2, 3],
    "title": "Important Update",
    "description": "Your order has been processed.",
    "date": "2024-01-15",
    "time": "10:30:00",
    "isActive": true,
    "isExpire": false,
    "created_at": "2024-01-10T10:00:00.000Z",
    "updated_at": "2024-01-10T10:00:00.000Z"
  }
}
```

### 4. Update Notification Scheduler
**PUT** `/api/manager/notificationSchedulers/:id`

Updates an existing notification scheduler.

**Path Parameters:**
- `id`: Notification scheduler ID (integer)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "date": "2024-01-16",
  "time": "11:00:00",
  "isActive": false
}
```

**Validation Rules:**
- All fields are optional
- `date` and `time` cannot be in the past
- `userId` must be an array of positive integers (min 1)
- `title` must be 1-255 characters
- `description` must be at least 1 character

**Response:**
```json
{
  "success": true,
  "message": "Notification scheduler updated successfully",
  "data": {
    "id": 1,
    "userId": [1, 2, 3],
    "title": "Updated Title",
    "description": "Updated description",
    "date": "2024-01-16",
    "time": "11:00:00",
    "isActive": false,
    "isExpire": false,
    "created_at": "2024-01-10T10:00:00.000Z",
    "updated_at": "2024-01-10T11:00:00.000Z"
  }
}
```

### 5. Delete Notification Scheduler
**DELETE** `/api/manager/notificationSchedulers/:id`

Deletes a notification scheduler.

**Path Parameters:**
- `id`: Notification scheduler ID (integer)

**Example Request:**
```
DELETE /api/manager/notificationSchedulers/1
```

**Response:**
```json
{
  "success": true,
  "message": "Notification scheduler deleted successfully",
  "data": {
    "message": "Notification scheduler deleted successfully"
  }
}
```

### 6. Get Notification Schedulers by User
**GET** `/api/manager/notificationSchedulers/user/:userId`

Retrieves all notification schedulers for a specific user.

**Path Parameters:**
- `userId`: User ID (integer)

**Query Parameters:**
- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 10, min: 1, max: 100)

**Example Request:**
```
GET /api/manager/notificationSchedulers/user/1?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "User notification schedulers retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": 1,
        "userId": [1, 2, 3],
        "title": "Important Update",
        "description": "Your order has been processed.",
        "date": "2024-01-15",
        "time": "10:30:00",
        "isActive": true,
        "isExpire": false,
        "created_at": "2024-01-10T10:00:00.000Z",
        "updated_at": "2024-01-10T10:00:00.000Z"
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

### 7. Toggle Notification Scheduler Status
**PATCH** `/api/manager/notificationSchedulers/:id/toggle`

Toggles the active status of a notification scheduler.

**Path Parameters:**
- `id`: Notification scheduler ID (integer)

**Example Request:**
```
PATCH /api/manager/notificationSchedulers/1/toggle
```

**Response:**
```json
{
  "success": true,
  "message": "Notification scheduler status toggled successfully",
  "data": {
    "id": 1,
    "userId": [1, 2, 3],
    "title": "Important Update",
    "description": "Your order has been processed.",
    "date": "2024-01-15",
    "time": "10:30:00",
    "isActive": false,
    "isExpire": false,
    "created_at": "2024-01-10T10:00:00.000Z",
    "updated_at": "2024-01-10T12:00:00.000Z"
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
      "field": "title",
      "message": "Title cannot be empty"
    }
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Notification scheduler not found"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. Manager role required."
}
```

## Data Model

### NotificationScheduler
```typescript
interface NotificationScheduler {
  id: number;                    // Primary key, auto-increment
  userId: number[];              // Array of user IDs to notify
  title: string;                 // Notification title (max 255 chars)
  description: string;           // Notification description
  date: string;                  // Scheduled date (YYYY-MM-DD)
  time: string;                  // Scheduled time (HH:MM:SS)
  isActive: boolean;             // Whether notification is active
  isExpire: boolean;             // Whether notification has been sent
  created_at: Date;              // Creation timestamp
  updated_at: Date;              // Last update timestamp
}
```

## Business Logic

1. **Date/Time Validation**: Scheduled notifications cannot be created or updated with past dates/times
2. **User Array**: At least one user ID must be provided
3. **Active Status**: New notifications default to active status
4. **Expiration**: Notifications are automatically marked as expired after being sent
5. **Search**: Supports case-insensitive search in title and description fields
6. **Pagination**: All list endpoints support pagination with configurable limits

## Integration with Notification System

The NotificationScheduler works in conjunction with the existing notification system:
- Scheduled notifications are processed by the cron job in `src/utils/notificationScheduler.ts`
- Notifications are sent to user devices via the existing device token system
- Expired notifications are automatically marked and won't be sent again

## Usage Examples

### Creating a Daily Reminder
```json
{
  "userId": [123, 456, 789],
  "title": "Daily Order Check",
  "description": "Please check your pending orders for today.",
  "date": "2024-01-15",
  "time": "09:00:00",
  "isActive": true
}
```

### Creating a One-time Announcement
```json
{
  "userId": [1, 2, 3, 4, 5],
  "title": "System Maintenance",
  "description": "System will be down for maintenance from 2-4 AM tonight.",
  "date": "2024-01-14",
  "time": "18:00:00",
  "isActive": true
}
```

### Bulk Operations
To manage multiple notifications, use the list endpoint with appropriate filters:
```
GET /api/manager/notificationSchedulers?isActive=true&date=2024-01-15
```

This will return all active notifications scheduled for January 15, 2024. 