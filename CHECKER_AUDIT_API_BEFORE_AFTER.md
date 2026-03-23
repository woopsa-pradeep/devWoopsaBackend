# Checker Audit API - Before vs After

This document shows the response contract changes after introducing checker audit tracking.

## 1) `GET /api/manager/epickReports`

### Before (example)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": [
      {
        "orderNumber": 139111,
        "customerNumber": 34009,
        "pickerUserNumber": 21,
        "picker": {
          "id": 6,
          "userNumber": "21",
          "name": "parth thakkar",
          "email": "parth@example.com"
        },
        "customer": {
          "customerNumber": 34009,
          "customerName": "RUDRA",
          "route": 12,
          "stop": 3
        },
        "startedAt": "2026-03-18T14:13:19.031Z",
        "completedAt": "2026-03-18T14:14:10.605Z"
      }
    ],
    "totalCount": 66,
    "page": 1,
    "limit": 10
  }
}
```

### After (example)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": [
      {
        "orderNumber": 139111,
        "customerNumber": 34009,
        "pickerUserNumber": 21,
        "picker": {
          "id": 6,
          "userNumber": "21",
          "name": "parth thakkar",
          "email": "parth@example.com"
        },
        "customer": {
          "customerNumber": 34009,
          "customerName": "RUDRA",
          "route": 12,
          "stop": 3
        },
        "startedAt": "2026-03-18T14:13:19.031Z",
        "completedAt": "2026-03-18T14:14:10.605Z",
        "totalQtyDeltaByChecker": 2,
        "totalBundlesDeltaByChecker": 1,
        "photoActionsCount": 2,
        "lastCheckerActionAt": "2026-03-18T14:16:04.120Z",
        "checkerUserIds": [14],
        "checkerActionLogs": [
          {
            "id": 51,
            "checkerUserId": 14,
            "actionType": "qty_update",
            "itemNumber": 104441,
            "lineNumber": null,
            "boxId": 258,
            "deltaQty": 1,
            "deltaBundles": 0,
            "meta": {
              "previousQty": 2,
              "newQty": 3,
              "totalQtyShipped": 3
            },
            "createdAt": "2026-03-18T14:15:21.220Z"
          },
          {
            "id": 52,
            "checkerUserId": 14,
            "actionType": "move_item",
            "itemNumber": 104441,
            "lineNumber": null,
            "boxId": 259,
            "deltaQty": 1,
            "deltaBundles": 0,
            "meta": {
              "sourceBoxId": 258,
              "destinationBoxId": 259,
              "sourceBoxType": "box",
              "destinationBoxType": "box"
            },
            "createdAt": "2026-03-18T14:15:45.101Z"
          },
          {
            "id": 53,
            "checkerUserId": 14,
            "actionType": "container_create",
            "itemNumber": null,
            "lineNumber": null,
            "boxId": 259,
            "deltaQty": 0,
            "deltaBundles": 1,
            "meta": {
              "containerType": "box"
            },
            "createdAt": "2026-03-18T14:15:40.800Z"
          },
          {
            "id": 54,
            "checkerUserId": 14,
            "actionType": "photo_add",
            "itemNumber": null,
            "lineNumber": null,
            "boxId": null,
            "deltaQty": 0,
            "deltaBundles": 0,
            "meta": {
              "existingImages": 0,
              "newImages": 2,
              "totalImages": 2
            },
            "createdAt": "2026-03-18T14:16:04.120Z"
          }
        ]
      }
    ],
    "totalCount": 66,
    "page": 1,
    "limit": 10
  }
}
```

---

## 2) `GET /api/epick/getOrderDetailsByOrderNumber/:orderNumber`

### Before (example)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "orderInfo": {
      "orderNumber": 139111,
      "orderDate": "2026-03-18",
      "invoiceNumber": 0,
      "bundles": 1,
      "totes": 0,
      "pickerId": 21,
      "pickerName": "parth thakkar",
      "confirmed": true,
      "invoiceTotal": 120.5,
      "customer": {
        "customerNumber": 34009,
        "customerName": "RUDRA",
        "address": "test",
        "city": "test",
        "state": "TE",
        "zip": "123412",
        "route": 12,
        "stop": 3
      },
      "startedAt": "2026-03-18T14:13:19.031Z",
      "completedAt": "2026-03-18T14:14:10.605Z",
      "allPickers": []
    },
    "orderItems": [],
    "overrideRequests": [],
    "summary": {
      "totalItemsOrdered": 4,
      "totalItemsShipped": 2,
      "totalItems": 1,
      "totalLines": 1,
      "scannedLines": 1
    },
    "salesCategorySummary": []
  }
}
```

### After (example)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "orderInfo": {
      "orderNumber": 139111,
      "orderDate": "2026-03-18",
      "invoiceNumber": 0,
      "bundles": 2,
      "totes": 0,
      "pickerId": 21,
      "pickerName": "parth thakkar",
      "confirmed": true,
      "invoiceTotal": 120.5,
      "customer": {
        "customerNumber": 34009,
        "customerName": "RUDRA",
        "address": "test",
        "city": "test",
        "state": "TE",
        "zip": "123412",
        "route": 12,
        "stop": 3
      },
      "startedAt": "2026-03-18T14:13:19.031Z",
      "completedAt": "2026-03-18T14:14:10.605Z",
      "allPickers": []
    },
    "orderItems": [],
    "overrideRequests": [],
    "summary": {
      "totalItemsOrdered": 4,
      "totalItemsShipped": 2,
      "totalItems": 1,
      "totalLines": 1,
      "scannedLines": 1
    },
    "checkerSummary": {
      "totalQtyDeltaByChecker": 2,
      "totalBundlesDeltaByChecker": 1,
      "photoActionsCount": 2,
      "lastCheckerActionAt": "2026-03-18T14:16:04.120Z",
      "checkerUserIds": [14]
    },
    "checkerActionLogs": [
      {
        "id": 51,
        "checkerUserId": 14,
        "actionType": "qty_update",
        "itemNumber": 104441,
        "lineNumber": null,
        "boxId": 258,
        "deltaQty": 1,
        "deltaBundles": 0,
        "meta": {
          "previousQty": 2,
          "newQty": 3,
          "totalQtyShipped": 3
        },
        "createdAt": "2026-03-18T14:15:21.220Z"
      },
      {
        "id": 52,
        "checkerUserId": 14,
        "actionType": "move_item",
        "itemNumber": 104441,
        "lineNumber": null,
        "boxId": 259,
        "deltaQty": 1,
        "deltaBundles": 0,
        "meta": {
          "sourceBoxId": 258,
          "destinationBoxId": 259
        },
        "createdAt": "2026-03-18T14:15:45.101Z"
      }
    ],
    "salesCategorySummary": []
  }
}
```

---

## Notes for Frontend

- Existing fields are unchanged and backward compatible.
- New fields are additive only.
- `checkerActionLogs` is ordered by newest first (`createdAt DESC`).
- `lineNumber` can be `null` when action is not line-specific.
- `meta` is flexible JSON and may vary by `actionType`.
