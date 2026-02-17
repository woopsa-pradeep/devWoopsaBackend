# Bulk Upload Item Images API Documentation

This document describes the bulk upload endpoint for item images.

## Endpoint

**POST** `/api/manager/bulkUploadItemImages`

## Authentication

All endpoints require authentication with a valid JWT token and either `MANAGER` or `SALES` role access.

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

## Request

### Request Body

The request body should be a JSON object with an `items` array. Each item in the array must contain:
- `itemNumber`: String or positive integer (required)
- `img_url`: Valid URL string (required)

### Example Request JSON

```json
{
  "items": [
    {
      "itemNumber": "11222",
      "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/17780.jpg"
    },
    {
      "itemNumber": "11232",
      "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/17780.jpg"
    },
    {
      "itemNumber": 12345,
      "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/12345.jpg"
    }
  ]
}
```

### Validation Rules

- `items`: Required array, must contain at least 1 item and maximum 1000 items
- `itemNumber`: Required, can be a string or positive integer
- `img_url`: Required, must be a valid URL string

## Response

### Success Response (200)

**All items processed successfully:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "processed": 3,
    "failed": 0,
    "results": [
      {
        "itemNumber": "11222",
        "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/17780.jpg",
        "action": "created",
        "id": 1
      },
      {
        "itemNumber": "11232",
        "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/17780.jpg",
        "action": "updated",
        "id": 2
      },
      {
        "itemNumber": "12345",
        "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/12345.jpg",
        "action": "created",
        "id": 3
      }
    ]
  },
  "message": "Item images uploaded successfully"
}
```

**Some items failed:**
```json
{
  "success": true,
  "data": {
    "success": false,
    "processed": 2,
    "failed": 1,
    "results": [
      {
        "itemNumber": "11222",
        "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/17780.jpg",
        "action": "created",
        "id": 1
      },
      {
        "itemNumber": "11232",
        "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/17780.jpg",
        "action": "updated",
        "id": 2
      }
    ],
    "errors": [
      {
        "itemNumber": "99999",
        "error": "Failed to process item"
      }
    ]
  },
  "message": "Some items failed to upload"
}
```

## Response Fields

### Results Array
Each result object contains:
- `itemNumber`: The item number that was processed (as string)
- `img_url`: The image URL that was saved
- `action`: Either `"created"` or `"updated"` indicating what action was taken
- `id`: The database ID of the ProductImage record

### Errors Array (if any)
Each error object contains:
- `itemNumber`: The item number that failed (or 'missing'/'unknown' if not provided)
- `error`: Error message describing what went wrong

## Behavior

1. **If product_number exists**: The existing `ProductImage` record is updated with the new `img_url`, and `isAllow` and `isActive` are set to `true`
2. **If product_number doesn't exist**: A new `ProductImage` record is created with:
   - `product_number`: The itemNumber (converted to string)
   - `img_url`: The provided URL
   - `isAllow`: `true`
   - `isActive`: `true`

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request body. Expected an array of items with itemNumber and img_url"
}
```

### 400 Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "items[0].img_url",
      "message": "Image URL must be a valid URL"
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

## Example cURL Request

```bash
curl -X POST https://your-api-domain.com/api/manager/bulkUploadItemImages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "itemNumber": "11222",
        "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/17780.jpg"
      },
      {
        "itemNumber": "11232",
        "img_url": "https://woopsacdn.blob.core.windows.net/product-images/item-images/17780.jpg"
      }
    ]
  }'
```

## Notes

1. **Bulk Processing**: The function processes items sequentially. If one item fails, it continues processing the remaining items.
2. **Item Number Format**: Item numbers are automatically converted to strings to match the `product_number` field type in the database.
3. **URL Validation**: The `img_url` must be a valid URL format (validated by Joi's `.uri()` validator).
4. **Maximum Items**: You can upload up to 1000 items in a single request.
5. **Minimum Items**: At least 1 item is required in the array.
