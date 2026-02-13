# Invoice Templates API Documentation

This document contains all API endpoints for **Customer Assign Invoice Templates** and **Invoice Templates**.

**Base URL:** `/api/manager` (or your configured base path)

**Authentication:** All endpoints require authentication with `ROLES.MANAGER` or `ROLES.SALES`

---

## Table of Contents

1. [Customer Assign Invoice Templates APIs](#customer-assign-invoice-templates-apis)
2. [Invoice Templates APIs](#invoice-templates-apis)

---

## Customer Assign Invoice Templates APIs

### 1. Create Customer Assign Invoice Template

**Endpoint:** `POST /customer-assign-invoice-templates`

**Description:** Creates a new customer-invoice template assignment.

**Request Body:**
```json
{
  "customerNumber": 50000,
  "templateId": 1
}
```

**Validation Rules:**
- `customerNumber`: Required, integer, positive number
- `templateId`: Required, integer, positive number

**Success Response (201):**
```json
{
  "success": true,
  "message": "Customer invoice template assignment created successfully",
  "data": {
    "id": 1,
    "customerNumber": 50000,
    "templateId": 1,
    "createdAt": "2026-02-11T14:32:17.891Z",
    "updatedAt": "2026-02-11T14:32:17.891Z"
  }
}
```

**Error Responses:**
- `400`: This customer-template assignment already exists
- `400`: Validation error (missing or invalid fields)

---

### 2. Get All Customer Assign Invoice Templates

**Endpoint:** `GET /customer-assign-invoice-templates`

**Description:** Retrieves a paginated list of customer-invoice template assignments with optional filtering.

**Query Parameters:**
- `page` (optional, default: 1): Page number (integer, min: 1)
- `limit` (optional, default: 10): Items per page (integer, min: 1, max: 100)
- `search` (optional): Search by customer number or template ID
- `customerNumber` (optional): Filter by customer number (integer, positive)
- `templateId` (optional): Filter by template ID (integer, positive)

**Example Request:**
```
GET /customer-assign-invoice-templates?page=1&limit=10&customerNumber=50000
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Customer invoice template assignments list retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "customerNumber": 50000,
        "templateId": 1,
        "createdAt": "2026-02-11T14:32:17.891Z",
        "updatedAt": "2026-02-11T14:32:17.891Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3. Get Customer Assign Invoice Template by ID

**Endpoint:** `GET /customer-assign-invoice-templates/:id`

**Description:** Retrieves a specific customer-invoice template assignment by ID.

**Path Parameters:**
- `id`: Assignment ID (integer)

**Example Request:**
```
GET /customer-assign-invoice-templates/1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Customer invoice template assignment retrieved successfully",
  "data": {
    "id": 1,
    "customerNumber": 50000,
    "templateId": 1,
    "createdAt": "2026-02-11T14:32:17.891Z",
    "updatedAt": "2026-02-11T14:32:17.891Z"
  }
}
```

**Error Responses:**
- `404`: Customer invoice template assignment not found

---

### 4. Update Customer Assign Invoice Template

**Endpoint:** `PUT /customer-assign-invoice-templates/:id`

**Description:** Updates an existing customer-invoice template assignment.

**Path Parameters:**
- `id`: Assignment ID (integer)

**Request Body:**
```json
{
  "customerNumber": 50001,
  "templateId": 2
}
```

**Validation Rules:**
- `customerNumber`: Optional, integer, positive number
- `templateId`: Optional, integer, positive number
- At least one field must be provided

**Success Response (200):**
```json
{
  "success": true,
  "message": "Customer invoice template assignment updated successfully",
  "data": {
    "id": 1,
    "customerNumber": 50001,
    "templateId": 2,
    "createdAt": "2026-02-11T14:32:17.891Z",
    "updatedAt": "2026-02-11T16:32:25.730Z"
  }
}
```

**Error Responses:**
- `404`: Customer invoice template assignment not found
- `400`: This customer-template assignment already exists
- `400`: Validation error

---

### 5. Delete Customer Assign Invoice Template

**Endpoint:** `DELETE /customer-assign-invoice-templates/:id`

**Description:** Deletes a customer-invoice template assignment.

**Path Parameters:**
- `id`: Assignment ID (integer)

**Example Request:**
```
DELETE /customer-assign-invoice-templates/1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Customer invoice template assignment deleted successfully",
  "data": {
    "message": "Customer invoice template assignment deleted successfully"
  }
}
```

**Error Responses:**
- `404`: Customer invoice template assignment not found

---

### 6. Bulk Add Customer Assign Invoice Templates

**Endpoint:** `POST /customer-assign-invoice-templates/bulk-add`

**Description:** Creates multiple customer-invoice template assignments in a single request.

**Request Body:**
```json
{
  "assignments": [
    {
      "customerNumber": 50000,
      "templateId": 1
    },
    {
      "customerNumber": 50001,
      "templateId": 1
    },
    {
      "customerNumber": 50002,
      "templateId": 2
    }
  ]
}
```

**Validation Rules:**
- `assignments`: Required, array, min 1 item
- Each assignment must have:
  - `customerNumber`: Required, integer, positive number
  - `templateId`: Required, integer, positive number

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully created 3 customer invoice template assignment(s)",
  "data": {
    "message": "Successfully created 3 customer invoice template assignment(s)",
    "data": [
      {
        "id": 1,
        "customerNumber": 50000,
        "templateId": 1,
        "createdAt": "2026-02-11T14:32:17.891Z",
        "updatedAt": "2026-02-11T14:32:17.891Z"
      },
      {
        "id": 2,
        "customerNumber": 50001,
        "templateId": 1,
        "createdAt": "2026-02-11T14:32:17.891Z",
        "updatedAt": "2026-02-11T14:32:17.891Z"
      },
      {
        "id": 3,
        "customerNumber": 50002,
        "templateId": 2,
        "createdAt": "2026-02-11T14:32:17.891Z",
        "updatedAt": "2026-02-11T14:32:17.891Z"
      }
    ],
    "count": 3
  }
}
```

**Error Responses:**
- `400`: Some assignments already exist
- `400`: Validation error

---

### 7. Bulk Remove Customer Assign Invoice Templates

**Endpoint:** `POST /customer-assign-invoice-templates/bulk-remove`

**Description:** Removes multiple customer-invoice template assignments in a single request.

**Request Body:**
```json
{
  "assignments": [
    {
      "customerNumber": 50000,
      "templateId": 1
    },
    {
      "customerNumber": 50001,
      "templateId": 1
    }
  ]
}
```

**Validation Rules:**
- `assignments`: Required, array, min 1 item
- Each assignment must have:
  - `customerNumber`: Required, integer, positive number
  - `templateId`: Required, integer, positive number

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully removed 2 customer invoice template assignment(s)",
  "data": {
    "message": "Successfully removed 2 customer invoice template assignment(s)",
    "count": 2
  }
}
```

**Error Responses:**
- `400`: Validation error

---

## Invoice Templates APIs

### 1. Create Invoice Template

**Endpoint:** `POST /invoice-templates`

**Description:** Creates a new invoice template.

**Request Body:**
```json
{
  "name": "Invoice Template 1",
  "mainTemplate": true,
  "groupBy": "",
  "showGroupHeader": true,
  "selectedColumns": {
    "orderQty": true,
    "shippedQty": true,
    "description": true,
    "itemNumber": true,
    "sortNumber": true,
    "upc": true,
    "price": true,
    "tax": false,
    "priceWithTax": true,
    "totalPrice": true,
    "retail1": false,
    "ebt": true
  },
  "upcOption": "barcode_primary",
  "showDistributorDetails": true,
  "showCustomerDetails": true,
  "showDocNumber": true,
  "showPageOf": true,
  "showInvoiceDate": true,
  "showInvoiceDateWithTime": false,
  "showRoute": true,
  "showStop": true,
  "showLogo": true,
  "logoPosition": "center",
  "showTerms": true,
  "headerOnPages": "all",
  "showHeaderMessage": false,
  "headerMessageFirstPage": "",
  "footerLayout": "messageLeft",
  "showFooterMessage": true,
  "footerMessageLastPage": "",
  "showSubTotal": true,
  "showDeliveryCharge": true,
  "showLastBalance": true,
  "showTotalAmountDue": true,
  "showReportGeneratedByWoopsa": true
}
```

**Validation Rules:**
- `name`: Required, string
- All other fields are optional with default values

**Success Response (201):**
```json
{
  "success": true,
  "message": "Invoice template created successfully",
  "data": {
    "id": 1,
    "name": "Invoice Template 1",
    "mainTemplate": true,
    "groupBy": "",
    "showGroupHeader": true,
    "selectedColumns": {
      "orderQty": true,
      "shippedQty": true,
      "description": true,
      "itemNumber": true,
      "sortNumber": true,
      "upc": true,
      "price": true,
      "tax": false,
      "priceWithTax": true,
      "totalPrice": true,
      "retail1": false,
      "ebt": true
    },
    "upcOption": "barcode_primary",
    "showDistributorDetails": true,
    "showCustomerDetails": true,
    "showDocNumber": true,
    "showPageOf": true,
    "showInvoiceDate": true,
    "showInvoiceDateWithTime": false,
    "showRoute": true,
    "showStop": true,
    "showLogo": true,
    "logoPosition": "center",
    "showTerms": true,
    "headerOnPages": "all",
    "showHeaderMessage": false,
    "headerMessageFirstPage": "",
    "footerLayout": "messageLeft",
    "showFooterMessage": true,
    "footerMessageLastPage": "",
    "showSubTotal": true,
    "showDeliveryCharge": true,
    "showLastBalance": true,
    "showTotalAmountDue": true,
    "showReportGeneratedByWoopsa": true,
    "createdAt": "2026-02-11T14:32:17.891Z",
    "updatedAt": "2026-02-11T14:32:17.891Z"
  }
}
```

**Error Responses:**
- `400`: Validation error

---

### 2. Get All Invoice Templates

**Endpoint:** `GET /invoice-templates`

**Description:** Retrieves a paginated list of invoice templates with optional filtering.

**Query Parameters:**
- `page` (optional, default: 1): Page number (integer, min: 1)
- `limit` (optional, default: 10): Items per page (integer, min: 1, max: 100)
- `search` (optional): Search by template name (case-insensitive)
- `mainTemplate` (optional): Filter by main template flag (boolean)

**Example Request:**
```
GET /invoice-templates?page=1&limit=10&search=Template&mainTemplate=true
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoice templates list retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Invoice Template 1",
        "mainTemplate": true,
        "groupBy": "",
        "showGroupHeader": true,
        "selectedColumns": {
          "orderQty": true,
          "shippedQty": true,
          "description": true,
          "itemNumber": true,
          "sortNumber": true,
          "upc": true,
          "price": true,
          "tax": false,
          "priceWithTax": true,
          "totalPrice": true,
          "retail1": false,
          "ebt": true
        },
        "upcOption": "barcode_primary",
        "showDistributorDetails": true,
        "showCustomerDetails": true,
        "showDocNumber": true,
        "showPageOf": true,
        "showInvoiceDate": true,
        "showInvoiceDateWithTime": false,
        "showRoute": true,
        "showStop": true,
        "showLogo": true,
        "logoPosition": "center",
        "showTerms": true,
        "headerOnPages": "all",
        "showHeaderMessage": false,
        "headerMessageFirstPage": "",
        "footerLayout": "messageLeft",
        "showFooterMessage": true,
        "footerMessageLastPage": "",
        "showSubTotal": true,
        "showDeliveryCharge": true,
        "showLastBalance": true,
        "showTotalAmountDue": true,
        "showReportGeneratedByWoopsa": true,
        "createdAt": "2026-02-11T14:32:17.891Z",
        "updatedAt": "2026-02-11T16:32:25.730Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3. Get Invoice Template by ID

**Endpoint:** `GET /invoice-templates/:id`

**Description:** Retrieves a specific invoice template by ID.

**Path Parameters:**
- `id`: Template ID (integer)

**Example Request:**
```
GET /invoice-templates/1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoice template retrieved successfully",
  "data": {
    "id": 1,
    "name": "Invoice Template 1",
    "mainTemplate": true,
    "groupBy": "",
    "showGroupHeader": true,
    "selectedColumns": {
      "orderQty": true,
      "shippedQty": true,
      "description": true,
      "itemNumber": true,
      "sortNumber": true,
      "upc": true,
      "price": true,
      "tax": false,
      "priceWithTax": true,
      "totalPrice": true,
      "retail1": false,
      "ebt": true
    },
    "upcOption": "barcode_primary",
    "showDistributorDetails": true,
    "showCustomerDetails": true,
    "showDocNumber": true,
    "showPageOf": true,
    "showInvoiceDate": true,
    "showInvoiceDateWithTime": false,
    "showRoute": true,
    "showStop": true,
    "showLogo": true,
    "logoPosition": "center",
    "showTerms": true,
    "headerOnPages": "all",
    "showHeaderMessage": false,
    "headerMessageFirstPage": "",
    "footerLayout": "messageLeft",
    "showFooterMessage": true,
    "footerMessageLastPage": "",
    "showSubTotal": true,
    "showDeliveryCharge": true,
    "showLastBalance": true,
    "showTotalAmountDue": true,
    "showReportGeneratedByWoopsa": true,
    "createdAt": "2026-02-11T14:32:17.891Z",
    "updatedAt": "2026-02-11T16:32:25.730Z"
  }
}
```

**Error Responses:**
- `404`: Invoice template not found

---

### 4. Update Invoice Template

**Endpoint:** `PUT /invoice-templates/:id`

**Description:** Updates an existing invoice template.

**Path Parameters:**
- `id`: Template ID (integer)

**Request Body:**
```json
{
  "name": "Updated Invoice Template 1",
  "mainTemplate": false,
  "showLogo": false,
  "logoPosition": "left"
}
```

**Validation Rules:**
- All fields are optional
- At least one field must be provided
- `selectedColumns` must be an object with boolean properties if provided

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoice template updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Invoice Template 1",
    "mainTemplate": false,
    "groupBy": "",
    "showGroupHeader": true,
    "selectedColumns": {
      "orderQty": true,
      "shippedQty": true,
      "description": true,
      "itemNumber": true,
      "sortNumber": true,
      "upc": true,
      "price": true,
      "tax": false,
      "priceWithTax": true,
      "totalPrice": true,
      "retail1": false,
      "ebt": true
    },
    "upcOption": "barcode_primary",
    "showDistributorDetails": true,
    "showCustomerDetails": true,
    "showDocNumber": true,
    "showPageOf": true,
    "showInvoiceDate": true,
    "showInvoiceDateWithTime": false,
    "showRoute": true,
    "showStop": true,
    "showLogo": false,
    "logoPosition": "left",
    "showTerms": true,
    "headerOnPages": "all",
    "showHeaderMessage": false,
    "headerMessageFirstPage": "",
    "footerLayout": "messageLeft",
    "showFooterMessage": true,
    "footerMessageLastPage": "",
    "showSubTotal": true,
    "showDeliveryCharge": true,
    "showLastBalance": true,
    "showTotalAmountDue": true,
    "showReportGeneratedByWoopsa": true,
    "createdAt": "2026-02-11T14:32:17.891Z",
    "updatedAt": "2026-02-11T16:32:25.730Z"
  }
}
```

**Error Responses:**
- `404`: Invoice template not found
- `400`: Validation error

---

### 5. Delete Invoice Template

**Endpoint:** `DELETE /invoice-templates/:id`

**Description:** Deletes an invoice template.

**Path Parameters:**
- `id`: Template ID (integer)

**Example Request:**
```
DELETE /invoice-templates/1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoice template deleted successfully",
  "data": {
    "message": "Invoice template deleted successfully"
  }
}
```

**Error Responses:**
- `404`: Invoice template not found

---

## Common Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": { ... }
}
```

---

## Field Descriptions

### Invoice Template Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `name` | string | Template name | Required |
| `mainTemplate` | boolean | Whether this is the main template | false |
| `groupBy` | string | Grouping option | '' |
| `showGroupHeader` | boolean | Show group header | true |
| `selectedColumns` | object | Column visibility settings | See below |
| `upcOption` | string | UPC display option | 'barcode_primary' |
| `showDistributorDetails` | boolean | Show distributor details | true |
| `showCustomerDetails` | boolean | Show customer details | true |
| `showDocNumber` | boolean | Show document number | true |
| `showPageOf` | boolean | Show page numbers | true |
| `showInvoiceDate` | boolean | Show invoice date | true |
| `showInvoiceDateWithTime` | boolean | Show invoice date with time | false |
| `showRoute` | boolean | Show route | true |
| `showStop` | boolean | Show stop | true |
| `showLogo` | boolean | Show logo | true |
| `logoPosition` | string | Logo position | 'center' |
| `showTerms` | boolean | Show terms | true |
| `headerOnPages` | string | Header display option | 'all' |
| `showHeaderMessage` | boolean | Show header message | false |
| `headerMessageFirstPage` | string | Header message for first page | '' |
| `footerLayout` | string | Footer layout | 'messageLeft' |
| `showFooterMessage` | boolean | Show footer message | true |
| `footerMessageLastPage` | string | Footer message for last page | '' |
| `showSubTotal` | boolean | Show subtotal | true |
| `showDeliveryCharge` | boolean | Show delivery charge | true |
| `showLastBalance` | boolean | Show last balance | true |
| `showTotalAmountDue` | boolean | Show total amount due | true |
| `showReportGeneratedByWoopsa` | boolean | Show Woopsa branding | true |

### Selected Columns Object

The `selectedColumns` object contains boolean flags for each column:

```json
{
  "orderQty": boolean,
  "shippedQty": boolean,
  "description": boolean,
  "itemNumber": boolean,
  "sortNumber": boolean,
  "upc": boolean,
  "price": boolean,
  "tax": boolean,
  "priceWithTax": boolean,
  "totalPrice": boolean,
  "retail1": boolean,
  "ebt": boolean
}
```

---

## Notes

1. **Authentication**: All endpoints require authentication with roles `MANAGER` or `SALES`
2. **Validation**: All request bodies are validated using Joi schemas
3. **Pagination**: List endpoints support pagination with `page` and `limit` parameters
4. **Search**: Search functionality is case-insensitive
5. **Unique Constraints**: Customer-template assignments have a unique constraint on `(customerNumber, templateId)`
6. **Timestamps**: All records include `createdAt` and `updatedAt` timestamps

---

## Example Usage

### Complete Workflow

1. **Create an invoice template:**
```bash
POST /invoice-templates
{
  "name": "Standard Invoice Template",
  "mainTemplate": true
}
```

2. **Assign template to a customer:**
```bash
POST /customer-assign-invoice-templates
{
  "customerNumber": 50000,
  "templateId": 1
}
```

3. **Bulk assign template to multiple customers:**
```bash
POST /customer-assign-invoice-templates/bulk-add
{
  "assignments": [
    { "customerNumber": 50000, "templateId": 1 },
    { "customerNumber": 50001, "templateId": 1 },
    { "customerNumber": 50002, "templateId": 1 }
  ]
}
```

4. **Get all templates for a customer:**
```bash
GET /customer-assign-invoice-templates?customerNumber=50000
```

5. **Update template:**
```bash
PUT /invoice-templates/1
{
  "name": "Updated Template Name",
  "showLogo": false
}
```

6. **Remove template assignment:**
```bash
DELETE /customer-assign-invoice-templates/1
```

---

**Last Updated:** 2026-02-11
