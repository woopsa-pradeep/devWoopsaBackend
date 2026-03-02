/**
 * Generate HTML email template for invoice emails
 * Displays order items in a table format similar to the product listing view
 */
export function generateInvoiceEmail(
  customerName: string,
  orderNumber: number,
  invoiceNumber: number,
  invoiceDate: Date | string,
  orderItems: Array<{
    Item_Number: number;
    Description: string;
    Quantity_Ordered: number;
    Quantity_Shipped: number;
    Price: number;
    OTP_Amount_State: number;
    PrepaidTax_Amount: number;
    Pack: number;
    UOM: string;
    CaseCount: number;
    TotalPrice: number;
  }>,
  deliveryCharge: number = 0
): string {
  // Format date
  const formattedDate = invoiceDate instanceof Date 
    ? invoiceDate.toLocaleDateString() 
    : new Date(invoiceDate).toLocaleDateString();

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.TotalPrice, 0);
  const totalItems = orderItems.reduce((sum, item) => sum + (item.Quantity_Shipped || item.Quantity_Ordered), 0);
  const grandTotal = subtotal + deliveryCharge;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
      padding: 20px;
    }
    .email-container {
      max-width: 900px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #3C7795 0%, #2a5a6e 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .invoice-info {
      background-color: #f8f9fa;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 15px;
    }
    .info-item {
      flex: 1;
      min-width: 200px;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 25px;
      color: #555;
    }
    .table-container {
      overflow-x: auto;
      margin: 25px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    thead {
      background-color: #3C7795;
      color: white;
    }
    th {
      padding: 15px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:nth-child(1) {
      text-align: left;
    }
    th:nth-child(2) {
      text-align: center;
    }
    th:nth-child(3) {
      text-align: center;
    }
    th:nth-child(4) {
      text-align: center;
    }
    th:nth-child(5) {
      text-align: right;
    }
    tbody tr {
      border-bottom: 1px solid #e9ecef;
      transition: background-color 0.2s;
    }
    tbody tr:hover {
      background-color: #f8f9fa;
    }
    tbody tr:last-child {
      border-bottom: none;
    }
    td {
      padding: 15px 12px;
      font-size: 14px;
      color: #333;
    }
    td:nth-child(1) {
      text-align: left;
    }
    td:nth-child(2) {
      text-align: center;
    }
    td:nth-child(3) {
      text-align: center;
    }
    td:nth-child(4) {
      text-align: center;
    }
    td:nth-child(5) {
      text-align: right;
      font-weight: 600;
      color: #3C7795;
    }
    .product-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }
    .product-details {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .summary {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e9ecef;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 15px;
    }
    .summary-label {
      color: #666;
    }
    .summary-value {
      font-weight: 600;
      color: #333;
    }
    .total-row {
      margin-top: 10px;
      padding-top: 15px;
      border-top: 2px solid #3C7795;
      font-size: 18px;
    }
    .total-label {
      color: #3C7795;
      font-weight: 700;
    }
    .total-value {
      color: #3C7795;
      font-weight: 700;
      font-size: 20px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 5px 0;
    }
    @media (max-width: 600px) {
      .invoice-info {
        flex-direction: column;
      }
      .info-item {
        min-width: 100%;
      }
      table {
        font-size: 12px;
      }
      th, td {
        padding: 10px 8px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Invoice #${invoiceNumber}</h1>
      <p>Order #${orderNumber}</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        <p>Dear ${customerName},</p>
        <p>Thank you for your business! Please find your invoice details below.</p>
      </div>

      <div class="invoice-info">
        <div class="info-item">
          <div class="info-label">Invoice Number</div>
          <div class="info-value">#${invoiceNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Order Number</div>
          <div class="info-value">#${orderNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Invoice Date</div>
          <div class="info-value">${formattedDate}</div>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Products</th>
              <th>Item Number</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems.map((item) => {
              const qty = item.Quantity_Shipped || item.Quantity_Ordered;
              const unitPrice = item.Price + item.OTP_Amount_State + item.PrepaidTax_Amount;
              const totalPrice = unitPrice * qty;
              const packInfo = item.Pack ? `Pack: ${item.Pack}` : '';
              const caseInfo = item.CaseCount ? `Case: ${item.CaseCount}` : '';
              const sizeInfo = item.UOM ? `Size: ${item.UOM}` : '';
              const details = [packInfo, caseInfo, sizeInfo].filter(Boolean).join(' ');

              return `
                <tr>
                  <td>
                    <div class="product-name">${item.Description || 'N/A'}</div>
                    ${details ? `<div class="product-details">${details}</div>` : ''}
                  </td>
                  <td>${item.Item_Number}</td>
                  <td>${qty}</td>
                  <td>$${unitPrice.toFixed(2)}</td>
                  <td>$${totalPrice.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="summary">
        <div class="summary-row">
          <span class="summary-label">Total Items:</span>
          <span class="summary-value">${totalItems}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Subtotal:</span>
          <span class="summary-value">$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Delivery Charge:</span>
          <span class="summary-value">$${deliveryCharge.toFixed(2)}</span>
        </div>
        <div class="summary-row total-row">
          <span class="total-label">Grand Total:</span>
          <span class="total-value">$${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>WOOPSA</strong></p>
      <p>This is an automated invoice email. Please do not reply to this message.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  </div>
</body>
</html>
  `;
}
