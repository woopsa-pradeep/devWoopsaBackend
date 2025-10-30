# PDF Generation API Documentation

## Overview
The `getPdfOfOrderDetails` API has been enhanced to support PDF generation and Azure upload functionality. When the `hasPrice` parameter is set to `true`, the API generates a PDF from order details and uploads it to Azure Blob Storage, returning the download URL.

## API Endpoint
```
GET /api/retailer/orderPdf
```

## Query Parameters
- `orderNumber` (required): The order number to generate PDF for
- `hasPrice` (optional): Boolean flag to determine if PDF should be generated
  - `true`: Generates PDF and uploads to Azure, returns URL
  - `false` or omitted: Returns JSON data only

## Authentication
- Requires retailer role authentication
- Uses JWT token in Authorization header

## Response Format

### When hasPrice = true
```json
{
  "success": true,
  "data": {
    "pdfUrl": "https://your-azure-storage.blob.core.windows.net/container/order-pdfs/order-12345-1703123456789.pdf",
    "fileName": "order-12345-1703123456789.pdf",
    "orderNumber": 12345,
    "totalItems": 3,
    "totalQuantity": 5,
    "totalAmount": 150.75
  },
  "message": "Order details retrieved successfully"
}
```

### When hasPrice = false or omitted
```json
{
  "success": true,
  "data": {
    "orderDetails": [
      {
        "Description": "Product Name",
        "Pack": 1,
        "CaseCount": 1,
        "Quantity_Ordered": 2,
        "Item_Number": "12345",
        "Price": 25.50
      }
    ],
    "orderNumber": 12345,
    "totalItems": 1,
    "totalQuantity": 2
  },
  "message": "Order details retrieved successfully"
}
```

## Technical Implementation

### PDF Generation Process
1. **Data Retrieval**: Fetches order details from the database using Sequelize ORM
2. **Data Transformation**: Maps database records to the format expected by `renderOrderTableFromERP`
3. **HTML Generation**: Uses `renderOrderTableFromERP` to create HTML table with pricing information
4. **PDF Creation**: Converts HTML to PDF using `generatePDFFromHTML` utility function
5. **Azure Upload**: Uploads PDF to Azure Blob Storage using `uploadFileToAzure` utility

### Azure Storage Configuration
- **Container**: `product-images` (configurable in `config.ts`)
- **Folder**: `order-pdfs`
- **File Naming**: `order-{orderNumber}-{timestamp}.pdf`
- **Content Type**: `application/pdf`

### Error Handling
- Returns appropriate error messages for missing order numbers
- Handles Azure upload failures with descriptive error messages
- Validates required parameters before processing

## Usage Examples

### Generate PDF with pricing
```bash
curl -X GET "http://localhost:3000/api/retailer/orderPdf?orderNumber=12345&hasPrice=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get order details without PDF
```bash
curl -X GET "http://localhost:3000/api/retailer/orderPdf?orderNumber=12345" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Dependencies
- `@azure/storage-blob`: Azure Blob Storage client
- `pdfkit`: PDF generation library
- `sequelize`: Database ORM
- `express`: Web framework

## Environment Variables Required
- `AZURE_STORAGE_CONNECTION_STRING`: Azure Storage connection string
- `AZURE_STORAGE_CONNECTION_STRING`: Container name (defaults to "product-images")

## Security Considerations
- PDFs are stored in Azure Blob Storage with container-level access
- File names are sanitized to prevent security issues
- Authentication is required for all API calls
- Role-based access control (retailer role only) 