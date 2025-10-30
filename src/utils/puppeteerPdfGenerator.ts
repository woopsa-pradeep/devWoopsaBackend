import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export class PuppeteerPDFGenerator {
  /**
   * Generate an order request PDF with the naming format: createOrderRequest-currentDate-day.pdf
   * @param orderData - The order data to include in the PDF
   * @param customerData - Customer information
   * @returns Promise<string> - The file path of the generated PDF
   */
  static async generateOrderRequestPDF(orderData: any, customerData: any): Promise<string> {
    try {
      // Create filename with current date
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }); // Full day name
      
      const fileName = `createOrderRequest-${dateString}-${dayName}.pdf`;
      
      // Create utils directory if it doesn't exist
      const utilsDir = path.join(__dirname);
      if (!fs.existsSync(utilsDir)) {
        fs.mkdirSync(utilsDir, { recursive: true });
      }
      
      const filePath = path.join(utilsDir, fileName);
      


      
      // Generate HTML content
      const htmlContent = this.generateOrderRequestHTML(orderData, customerData);
      
      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set content and generate PDF
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      await page.pdf({
        path: filePath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true
      });
      
      await browser.close();
      
      return filePath;
      
    } catch (error) {
      console.error('Error generating PDF with Puppeteer:', error);
      throw error;
    }
  }
  
  /**
   * Generate HTML content for the order request PDF
   * @param orderData - Order information
   * @param customerData - Customer information
   * @returns string - HTML content
   */
  private static generateOrderRequestHTML(orderData: any, customerData: any): string {
    console.log(orderData,'orderData--->>')
    const currentDate = new Date().toLocaleDateString();
    const orderNumber = orderData.orderHeader?.Order_Number || 'N/A';
    const orderSource = orderData.orderHeader?.Order_Source === 12 ? 'App' : 
                       orderData.orderHeader?.Order_Source === 13 ? 'Web' : 'ERP';
    const deliveryCharge = orderData.orderHeader?.Delivery_Charge || 0;
    const invoiceTotal = orderData.orderHeader?.Invoice_Total || 0;
    
    // Calculate total amount from order details
    let totalAmount = 0;
    if (orderData.orderDetails && orderData.orderDetails.length > 0) {
      totalAmount = orderData.orderDetails.reduce((sum: number, item: any) => {
        return sum + ((Number(item.Price )+ Number(item.OTP_Amount_State) || 0) * (Number(item.Quantity_Ordered) || 0));
      }, 0);
    }
    
    // Generate order items table rows
    const orderItemsRows = orderData.orderDetails?.map((item: any) => {
      const itemTotal = (item.Price + item.OTP_Amount_State || 0) * (item.Quantity_Ordered || 0);
      return `
        <tr>
          <td>${item.Item_Number?.toString() || 'N/A'}</td>
          <td>${item.ItemDescription || 'N/A'}</td>
          <td>${item.Quantity_Ordered?.toString() || '0'}</td>
          <td>${item.CaseCount?.toString() || '0'}</td>
           <td>${item.UOM?.toString() || '0'}</td>
          <td>${item.Pack?.toString() || '0'}</td>
         
          <td>$${(item.Price + item.OTP_Amount_State || 0) || item.Price + item.OTP_Amount_State}</td>
          <td>$${itemTotal}</td>
        </tr>
      `;
    }).join('') || '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Request</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 28px;
            margin: 0;
            color: #2c3e50;
          }
          
          .order-info {
            margin-bottom: 30px;
          }
          
          .order-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          .section {
            margin-bottom: 25px;
          }
          
          .section h2 {
            font-size: 18px;
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          
          .customer-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          .order-details p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
          }
          
          .item-number {
            width: 15%;
          }
          
          .description {
            width: 45%;
          }
          
          .quantity, .price, .total {
            width: 13%;
            text-align: center;
          }
          
          .total-row {
            font-weight: bold;
            background-color: #f8f9fa;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 10px;
            }
            
            .header {
              margin-bottom: 20px;
            }
            
            table {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Order Request</h1>
        </div>
        
        <div class="order-info">
          <p><strong>Date:</strong> ${currentDate}</p>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
        </div>
        
        <div class="section">
          <h2>Customer Information</h2>
          <div class="customer-info">
            <p><strong>Customer Name:</strong> ${customerData?.C_Name || 'N/A'}</p>
            <p><strong>Customer Number:</strong> ${customerData?.C_Number || 'N/A'}</p>
            <p><strong>Address:</strong> ${customerData?.C_Address || 'N/A'}</p>
            <p><strong>City:</strong> ${customerData?.C_City || 'N/A'}, <strong>State:</strong> ${customerData?.C_State || 'N/A'}</p>
            <p><strong>Phone:</strong> ${customerData?.C_Phone || 'N/A'}</p>
            <p><strong>Email:</strong> ${customerData?.C_Email || 'N/A'}</p>
          </div>
        </div>
        
        <div class="section">
          <h2>Order Details</h2>
          <div class="order-details">
            <p><strong>Order Source:</strong> ${orderSource}</p>
            <p><strong>Delivery Charge:</strong> $${deliveryCharge.toFixed(2)}</p>
            <p><strong>Invoice Total:</strong> $${(totalAmount + deliveryCharge).toFixed(2)}</p>
          </div>
        </div>
        
        <div class="section">
          <h2>Order Items</h2>
          <table>
            <thead>
              <tr>
                <th class="item-number">Item #</th>
                <th class="description">Description</th>
                <th class="quantity">Qty</th>
                <th class="quantity">Case</th>
                <th class="quantity">Size</th>
                <th class="quantity">Pack</th>
                <th class="price">Price</th>
                <th class="total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItemsRows}
              <tr class="total-row">
                <td colspan="7" style="text-align: right;"><strong>Total Amount:</strong></td>
                <td style="text-align: center;"><strong>$${totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>This document was generated automatically by the CDT system.</p>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Delete a PDF file
   * @param filePath - Path to the file to delete
   * @returns Promise<boolean> - Success status
   */
  static async deletePDFFile(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('Error deleting PDF file:', error);
        resolve(false);
      }
    });
  }
  
  /**
   * Get the file path for a specific date
   * @param date - Date to generate filename for
   * @returns string - The file path
   */
  static getFilePathForDate(date: Date = new Date()): string {
    const dateString = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const fileName = `createOrderRequest-${dateString}-${dayName}.pdf`;
    return path.join(__dirname, fileName);
  }
} 