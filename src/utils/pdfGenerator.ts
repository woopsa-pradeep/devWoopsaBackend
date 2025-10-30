import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export class PDFGenerator {
  /**
   * Generate an order request PDF with the naming format: createOrderRequest-currentDate-day.pdf
   * @param orderData - The order data to include in the PDF
   * @param customerData - Customer information
   * @returns Promise<string> - The file path of the generated PDF
   */
  static async generateOrderRequestPDF(orderData: any, customerData: any): Promise<string> {
    return new Promise((resolve, reject) => {
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
        
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });
        
        // Pipe PDF to file
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // Add content to PDF
        this.addOrderRequestContent(doc, orderData, customerData);
        
        // Finalize PDF
        doc.end();
        
        stream.on('finish', () => {
          resolve(filePath);
        });
        
        stream.on('error', (error) => {
          reject(error);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Add content to the order request PDF
   * @param doc - PDFDocument instance
   * @param orderData - Order information
   * @param customerData - Customer information
   */
  private static addOrderRequestContent(doc: any, orderData: any, customerData: any): void {
    // Header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Order Request', { align: 'center' })
       .moveDown(0.5);
    
    // Date and Order Number
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'left' })
       .text(`Order Number: ${orderData.orderHeader?.Order_Number || 'N/A'}`, { align: 'left' })
       .moveDown(1);
    
    // Customer Information Section
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Customer Information')
       .moveDown(0.5);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Customer Name: ${customerData?.C_Name || 'N/A'}`)
       .text(`Customer Number: ${customerData?.C_Number || 'N/A'}`)
       .text(`Address: ${customerData?.C_Address || 'N/A'}`)
       .text(`City: ${customerData?.C_City || 'N/A'}, State: ${customerData?.C_State || 'N/A'}`)
       .text(`Phone: ${customerData?.C_Phone || 'N/A'}`)
       .text(`Email: ${customerData?.C_Email || 'N/A'}`)
       .moveDown(1);
    
    // Order Details Section
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Order Details')
       .moveDown(0.5);
    
    // Order header information
    if (orderData.orderHeader) {
      const header = orderData.orderHeader;
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Order Source: ${header.Order_Source === 12 ? 'App' : header.Order_Source === 13 ? 'Web' : 'ERP'}`)
         .text(`Delivery Charge: $${header.Delivery_Charge || 0}`)
         .text(`Invoice Total: $${header.Invoice_Total || 0}`)
         .moveDown(1);
    }
    
    // Order Items Table
    if (orderData.orderDetails && orderData.orderDetails.length > 0) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Order Items')
         .moveDown(0.5);
      
      // Table headers
      const tableTop = doc.y;
      const itemNumberX = 50;
      const descriptionX = 120;
      const quantityX = 350;
      const priceX = 420;
      const totalX = 500;
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Item #', itemNumberX, tableTop)
         .text('Description', descriptionX, tableTop)
         .text('Qty', quantityX, tableTop)
         .text('Price', priceX, tableTop)
         .text('Total', totalX, tableTop)
         .moveDown(0.5);
      
      // Table content
      let currentY = doc.y;
      let totalAmount = 0;
      
      orderData.orderDetails.forEach((item: any, index: number) => {
        const itemTotal = (item.Price || 0) * (item.Quantity_Ordered || 0);
        totalAmount += itemTotal;
        
        doc.fontSize(9)
           .font('Helvetica')
           .text(item.Item_Number?.toString() || 'N/A', itemNumberX, currentY)
           .text(item.ItemDescription || 'N/A', descriptionX, currentY, { width: 200 })
           .text(item.Quantity_Ordered?.toString() || '0', quantityX, currentY)
           .text(`$${(item.Price || 0).toFixed(2)}`, priceX, currentY)
           .text(`$${itemTotal.toFixed(2)}`, totalX, currentY);
        
        currentY += 20;
        
        // Add new page if needed
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      });
      
      // Total line
      doc.moveDown(1)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(`Total Amount: $${totalAmount.toFixed(2)}`, { align: 'right' });
    }
    
    // Footer
    doc.moveDown(2)
       .fontSize(10)
       .font('Helvetica')
       .text('This document was generated automatically by the CDT system.', { align: 'center' });
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