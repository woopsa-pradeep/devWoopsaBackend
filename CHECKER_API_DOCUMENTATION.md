# Checker API Documentation

All APIs require **CHECKER** role authentication. Replace `YOUR_JWT_TOKEN` with a valid JWT token and `localhost:3000` with your server URL.

---

## 1. Get Order - Get Completed Orders

**Endpoint:** `GET /api/checker/getOrder`

**Description:** Returns all completed orders ready for checker verification.

**cURL Command:**

```bash
curl -X GET "http://localhost:3000/api/checker/getOrder" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response Example:**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "orderNumber": 132657,
      "route": 5,
      "stop": 12,
      "customerName": "ABC Store",
      "time": "2024-01-15T10:30:00.000Z",
      "box": [1, 2, 3],
      "tote": [4, 5],
      "drink": [6],
      "startedAt": "2024-01-15T08:00:00.000Z",
      "completedAt": "2024-01-15T10:30:00.000Z",
      "invoiced": false,
      "pickerName": "John Doe"
    },
    {
      "orderNumber": 132658,
      "route": 3,
      "stop": 8,
      "customerName": "XYZ Retail",
      "time": "2024-01-15T11:00:00.000Z",
      "box": [7, 8],
      "tote": [],
      "drink": [9],
      "startedAt": "2024-01-15T09:00:00.000Z",
      "completedAt": "2024-01-15T11:00:00.000Z",
      "invoiced": true,
      "pickerName": "Jane Smith"
    }
  ]
}
```

**Empty Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": []
}
```

---

## 2. Get Box Item - Get Items in a Box

**Endpoint:** `GET /api/checker/getBoxItem/:boxId`

**Description:** Returns all items in a specific box with their details.

**Path Parameters:**

- `boxId` (required) - The ID of the box

**cURL Command:**

```bash
curl -X GET "http://localhost:3000/api/checker/getBoxItem/5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response Example:**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "orderNumber": 132657,
      "itemNumber": 1001,
      "qty": 10,
      "isSubsitute": false,
      "description": "Product Name",
      "location": "A1",
      "section": "Section 1",
      "pack": 12,
      "caseCount": 12,
      "uom": "CS",
      "inventoryOnHand": 150,
      "masterImage": "https://azureimageserver.com/1234567890123.jpg",
      "isDistributorImageShow": true,
      "distributorImage": "https://example.com/product-1001.jpg",
      "upcList": [
        {
          "UPC_Number": "1234567890123"
        }
      ]
    },
    {
      "orderNumber": 132657,
      "itemNumber": 1002,
      "qty": 5,
      "isSubsitute": true,
      "description": "Substitute Product",
      "location": "B2",
      "section": "Section 2",
      "pack": 24,
      "caseCount": 24,
      "uom": "CS",
      "inventoryOnHand": 200,
      "masterImage": "https://azureimageserver.com/9876543210987.jpg",
      "isDistributorImageShow": false,
      "distributorImage": null,
      "upcList": [
        {
          "UPC_Number": "9876543210987"
        }
      ]
    }
  ]
}
```

**Empty Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": []
}
```

---

## 3. Move Items to Box

**Endpoint:** `POST /api/checker/moveItemsToBox`

**Description:** Moves items from one box to another box. Supports partial moves.

**Request Body:**

```json
{
  "sourceBoxId": 5,
  "destinationBoxId": 6,
  "itemNumber": 1001,
  "qty": 5
}
```

**cURL Command:**

```bash
curl -X POST "http://localhost:3000/api/checker/moveItemsToBox" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceBoxId": 5,
    "destinationBoxId": 6,
    "itemNumber": 1001,
    "qty": 5
  }'
```

**Response Example:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "success": true,
    "message": "Successfully moved 5 quantity of item 1001 from box 5 to box 6",
    "sourceBoxId": 5,
    "destinationBoxId": 6,
    "itemNumber": 1001,
    "qtyMoved": 5,
    "sourceBoxType": "box",
    "destinationBoxType": "box"
  }
}
```

**Error Response (Insufficient Quantity):**

```json
{
  "success": false,
  "message": "Insufficient quantity. Available: 3, Requested: 5",
  "data": null
}
```

---

## 4. Update Item Quantity

**Endpoint:** `POST /api/checker/updateItemQty`

**Description:** Updates the quantity of an item in an order. Only works if invoice is not created.

**Request Body:**

```json
{
  "orderNumber": 132657,
  "itemNumber": 1001,
  "qty": 15
}
```

**cURL Command:**

```bash
curl -X POST "http://localhost:3000/api/checker/updateItemQty" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 132657,
    "itemNumber": 1001,
    "qty": 15
  }'
```

**Response Example:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "success": true,
    "message": "Successfully updated quantity for item 1001 to 15",
    "orderNumber": 132657,
    "itemNumber": 1001,
    "qty": 15
  }
}
```

**Error Response (Invoice Created):**

```json
{
  "success": false,
  "message": "Cannot update quantity. Invoice has already been created for this order.",
  "data": null
}
```

---

## 5. Create Container and Move Items

**Endpoint:** `POST /api/checker/createContainerAndMoveItems`

**Description:** Creates a new container (box/tote/drink) and moves items from a source box to it.

**Request Body:**

```json
{
  "orderNumber": 132657,
  "containerType": "box",
  "sourceBoxId": 5,
  "items": [
    {
      "itemNumber": 1001,
      "qty": 5
    },
    {
      "itemNumber": 1002,
      "qty": 3
    }
  ]
}
```

**cURL Command:**

```bash
curl -X POST "http://localhost:3000/api/checker/createContainerAndMoveItems" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 132657,
    "containerType": "box",
    "sourceBoxId": 5,
    "items": [
      {
        "itemNumber": 1001,
        "qty": 5
      },
      {
        "itemNumber": 1002,
        "qty": 3
      }
    ]
  }'
```

**Response Example:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "success": true,
    "message": "Successfully created box 10 and moved items",
    "orderNumber": 132657,
    "newContainerId": 10,
    "containerType": "box",
    "itemsMoved": [
      {
        "itemNumber": 1001,
        "qty": 5
      },
      {
        "itemNumber": 1002,
        "qty": 3
      }
    ]
  }
}
```

**Note:** `containerType` must be one of: `"box"`, `"tote"`, or `"drink"`

---

## 6. Ready for Delivery

**Endpoint:** `POST /api/checker/readyForDelivery/:orderNumber`

**Description:** Marks an order as ready for delivery. Order must be in 'completed' status.

**Path Parameters:**

- `orderNumber` (required) - The order number

**cURL Command:**

```bash
curl -X POST "http://localhost:3000/api/checker/readyForDelivery/132657" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response Example:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "success": true,
    "message": "Order 132657 marked as ready for delivery",
    "orderNumber": 132657,
    "status": "ready_for_delivery",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Response (Order Not Completed):**

```json
{
  "success": false,
  "message": "Order status must be 'completed' to mark as ready for delivery. Current status: in_progress",
  "data": null
}
```

---

## 7. Capture Photos

**Endpoint:** `POST /api/checker/capturePhotos/:id`

**Description:** Uploads photos and adds notes to a box.

**Path Parameters:**

- `id` (required) - The box ID

**Request Body (multipart/form-data):**

- `images` (file[]) - Array of image files
- `notes` (string, optional) - Notes for the box

**cURL Command:**

```bash
curl -X POST "http://localhost:3000/api/checker/capturePhotos/5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "notes=Box is damaged on corner"
```

**Response Example:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "success": true,
    "message": "Photos captured successfully",
    "images": [
      "https://azurestorage.blob.core.windows.net/checker/image1-12345.jpg",
      "https://azurestorage.blob.core.windows.net/checker/image2-12345.jpg"
    ],
    "notes": "Box is damaged on corner"
  }
}
```

**Note:** Images are uploaded to Azure storage in the "checker" folder.

---

## 8. Print Labels

**Endpoint:** `POST /api/checker/printLabels`

**Description:** Generates and prints labels for boxes. Supports multiple label sizes.

**Request Body:**

```json
{
  "orderNumber": 132657,
  "size": "4x6",
  "boxIds": [1, 2, 3]
}
```

**Valid Sizes:** `"4x3"`, `"4x6"`, `"3x6"`, `"3x2"`, `"4x4"`, `"2x2"`, `"2x3"`, `"A4"`

**Note:** `boxIds` is optional. If not provided, prints labels for all boxes in the order.

**cURL Command:**

```bash
curl -X POST "http://localhost:3000/api/checker/printLabels" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 132657,
    "size": "4x6",
    "boxIds": [1, 2, 3]
  }'
```

**Response Example:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "success": true,
    "message": "Successfully generated 3 label(s)",
    "pdfUrls": [
      "https://azurestorage.blob.core.windows.net/checker/labels/order-132657-box-1-1of5-1234567890.pdf",
      "https://azurestorage.blob.core.windows.net/checker/labels/order-132657-box-2-2of5-1234567891.pdf",
      "https://azurestorage.blob.core.windows.net/checker/labels/order-132657-box-3-3of5-1234567892.pdf"
    ],
    "orderNumber": 132657,
    "size": "4x6",
    "totalBoxes": 5,
    "printedBoxes": 3
  }
}
```

**Print All Boxes (without boxIds):**

```bash
curl -X POST "http://localhost:3000/api/checker/printLabels" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 132657,
    "size": "4x6"
  }'
```

---

## 9. Test Labels

**Endpoint:** `GET /api/checker/testLabels`

**Description:** Generates test labels for all sizes or a specific size. Used for testing label formats.

**Query Parameters:**

- `size` (optional) - Label size: `"4x3"`, `"4x6"`, `"3x6"`, `"3x2"`, `"4x4"`, `"2x2"`, `"2x3"`, `"A4"`. If not provided, generates all sizes.

**cURL Command (All Sizes):**

```bash
curl -X GET "http://localhost:3000/api/checker/testLabels" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**cURL Command (Specific Size):**

```bash
curl -X GET "http://localhost:3000/api/checker/testLabels?size=4x6" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response Example (All Sizes):**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "size": "4x3",
      "success": true,
      "pdfUrl": "https://azurestorage.blob.core.windows.net/checker/labels/test-4x3-1234567890.pdf"
    },
    {
      "size": "4x6",
      "success": true,
      "pdfUrl": "https://azurestorage.blob.core.windows.net/checker/labels/test-4x6-1234567891.pdf"
    },
    {
      "size": "3x6",
      "success": true,
      "pdfUrl": "https://azurestorage.blob.core.windows.net/checker/labels/test-3x6-1234567892.pdf"
    }
  ]
}
```

**Response Example (Single Size):**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "size": "4x6",
      "success": true,
      "pdfUrl": "https://azurestorage.blob.core.windows.net/checker/labels/test-4x6-1234567890.pdf"
    }
  ]
}
```

---

## Common Error Responses

### 401 Unauthorized (Missing Token)

```json
{
  "success": false,
  "message": "Token missing",
  "data": null
}
```

### 403 Forbidden (Invalid Role)

```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null
}
```

### 400 Bad Request (Validation Error)

```json
{
  "success": false,
  "message": "Missing required fields: sourceBoxId, destinationBoxId, itemNumber, qty",
  "data": null
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Order not found",
  "data": null
}
```

---

## Notes

- All APIs require **CHECKER** role authentication
- Replace `YOUR_JWT_TOKEN` with a valid JWT token obtained from `/api/auth/checkerLogin`
- Base URL: `http://localhost:3000/api/checker`
- All timestamps are in ISO 8601 format (UTC)
- Image URLs are stored in Azure Blob Storage
- PDF labels are generated using Puppeteer and uploaded to Azure
- Box types: `"box"`, `"tote"`, `"drink"`
- Label sizes: `"4x3"`, `"4x6"`, `"3x6"`, `"3x2"`, `"4x4"`, `"2x2"`, `"2x3"`, `"A4"`
