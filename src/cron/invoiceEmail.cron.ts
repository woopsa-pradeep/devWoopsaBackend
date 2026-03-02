import { OrderHeader } from '../models/mmsql/orderHeader.model';
import { OrderDetail } from '../models/mmsql/orderDetail.model';
import { Customer } from '../models/mmsql/customer.model';
import { Inventory } from '../models/mmsql/inventory.model';
import { CustomerInvoiceEmailLog } from '../models/postgres/customerInvoiceEmailLog.model';
import { sendEmail } from '../utils/sendMail';
import { generateInvoiceEmail } from '../view/invoiceEmail';
import { Op } from 'sequelize';
import moment from 'moment-timezone';

/**
 * Get current date in Eastern Time (YYYY-MM-DD format)
 */
function getEasternDate(): string {
  return moment.tz('America/New_York').format('YYYY-MM-DD');
}

/**
 * Get current hour in Eastern Time
 */
function getEasternHour(): number {
  return moment.tz('America/New_York').hour();
}

/**
 * Process and send invoice emails for orders with invoices
 * Runs every hour from 2 PM to 10 PM Eastern Time
 */
export async function processInvoiceEmails(): Promise<void> {
  try {
    console.log('[Invoice Email Cron] Starting invoice email processing...');

    // Get current date and hour in Eastern Time
    const currentDate = getEasternDate();
    const currentHour = getEasternHour();

    console.log('currentHour', currentHour);
    console.log('currentDate', currentDate);

    // Only run between 2 PM (14) and 10 PM (22)
    // if (currentHour < 14 || currentHour >= 22) {
    //   console.log(`[Invoice Email Cron] Outside operating hours (current hour: ${currentHour}). Skipping.`);
    //   return;
    // }

    console.log(`[Invoice Email Cron] Processing invoices for date: ${currentDate}`);

    // Find all orders with Invoice_Number > 0 and Order_Date = current date
    const orders :any= await OrderHeader.findAll({
      where: {
        Order_Date: currentDate,
        Invoice_Number: {
          [Op.gt]: 0,
        },
      },
      attributes: [
        'Order_Number',
        'C_Number',
        'Invoice_Number',
        'Order_Date',
        'Invoice_Date',
        'Delivery_Charge',
      ],
    })

    console.log(`[Invoice Email Cron] Found ${orders.length} orders with invoices`);

    // Process each order
    for (const order of orders) {
      try {
        const orderNumber = order.Order_Number;
        const customerNumber = order.C_Number;
        const invoiceNumber = order.Invoice_Number as number || 0;

        // Check if email already sent for this invoice
        const existingLog = await CustomerInvoiceEmailLog.findOne({
          where: {
            orderNumber: orderNumber,
            invoiceNumber: invoiceNumber.toString(),
            customerNumber: customerNumber.toString(),
            mailSent: true,
          },
        });

        if (existingLog) {
          console.log(`[Invoice Email Cron] Email already sent for Invoice #${invoiceNumber}, Order #${orderNumber}. Skipping.`);
          continue;
        }

        // Get customer information
        const customer = await Customer.findOne({
          where: { C_Number: customerNumber },
          attributes: ['C_Number', 'C_Name', 'C_Email', 'C_CoName'],
        });

        if (!customer || !customer.C_Email) {
          console.log(`[Invoice Email Cron] No email found for customer #${customerNumber}, Order #${orderNumber}. Skipping.`);
          
          // Log that email was not sent due to missing email
          await CustomerInvoiceEmailLog.create({
            customerNumber: customerNumber.toString(),
            mailSent: false,
            invoiceNumber: invoiceNumber.toString(),
            invoiceDate: order.Invoice_Date || order.Order_Date,
            mailSendDate: null,
            emailAddress: null,
            status: 'failed',
            errorMessage: 'Customer email not found',
          });
          continue;
        }

        // Get order details with inventory information using include
        const orderDetails = await OrderDetail.findAll({
          where: { Order_Number: orderNumber },
          attributes: [
            'Item_Number',
            'Quantity_Ordered',
            'Quantity_Shipped',
            'Price',
            'OTP_Amount_State',
            'PrepaidTax_Amount',
          ],
          include: [
            {
              model: Inventory,
              as: 'inventory',
              attributes: ['Item_Number', 'Description', 'Pack', 'UOM', 'CaseCount'],
              required: false,
            },
          ],
        });

        if (!orderDetails || orderDetails.length === 0) {
          console.log(`[Invoice Email Cron] No order details found for Order #${orderNumber}. Skipping.`);
          continue;
        }

        // Combine order details with inventory information
        const orderItems = orderDetails.map((detail: any) => {
          const inventory = detail.inventory;
          return {
            Item_Number: detail.Item_Number,
            Description: inventory?.Description || 'N/A',
            Quantity_Ordered: detail.Quantity_Ordered || 0,
            Quantity_Shipped: detail.Quantity_Shipped || 0,
            Price: detail.Price || 0,
            OTP_Amount_State: detail.OTP_Amount_State || 0,
            PrepaidTax_Amount: detail.PrepaidTax_Amount || 0,
            Pack: inventory?.Pack || 0,
            UOM: inventory?.UOM || 'N/A',
            CaseCount: inventory?.CaseCount || 0,
            TotalPrice: ((detail.Price || 0) + (detail.OTP_Amount_State || 0) + (detail.PrepaidTax_Amount || 0)) * (detail.Quantity_Shipped || detail.Quantity_Ordered || 0),
          };
        });

        // Get Delivery_Charge from order
        const deliveryCharge = parseFloat(order.Delivery_Charge) || 0;

        // Generate email HTML
        const emailHtml = generateInvoiceEmail(
          customer.C_Name || customer.C_CoName || 'Customer',
          orderNumber,
          invoiceNumber,
          order.Invoice_Date || order.Order_Date,
          orderItems,
          deliveryCharge
        );

        // Send email
        const emailSent = await sendEmail({
          to: customer.C_Email,
          subject: `Invoice #${invoiceNumber} - Order #${orderNumber} - WOOPSA`,
          html: emailHtml,
        });

        // Log the email attempt
        await CustomerInvoiceEmailLog.create({

        orderNumber: orderNumber,
          customerNumber: customerNumber.toString(),
          mailSent: emailSent,
          invoiceNumber: invoiceNumber.toString(),
          invoiceDate: order.Invoice_Date || order.Order_Date,
          mailSendDate: emailSent ? new Date() : null,
          emailAddress: customer.C_Email,
          status: emailSent ? 'sent' : 'failed',
          errorMessage: emailSent ? null : 'Email sending failed',
        });

        if (emailSent) {
          console.log(`[Invoice Email Cron] ✅ Email sent successfully for Invoice #${invoiceNumber}, Order #${orderNumber} to ${customer.C_Email}`);
        } else {
          console.log(`[Invoice Email Cron] ❌ Failed to send email for Invoice #${invoiceNumber}, Order #${orderNumber}`);
        }
      } catch (error: any) {
        console.error(`[Invoice Email Cron] Error processing Order #${order.Order_Number}:`, error);
        
        // Log the error
        try {
          await CustomerInvoiceEmailLog.create({
            orderNumber: order.Order_Number,
            customerNumber: order.C_Number.toString(),
            mailSent: false,
            invoiceNumber: order.Invoice_Number.toString(),
            invoiceDate: order.Invoice_Date || order.Order_Date,
            mailSendDate: null,
            status: 'failed',
            errorMessage: error?.message || 'Unknown error',
          });
        } catch (logError) {
          console.error('[Invoice Email Cron] Failed to log error:', logError);
        }
      }
    }

    console.log('[Invoice Email Cron] Invoice email processing completed.');
  } catch (error) {
    console.error('[Invoice Email Cron] Fatal error in invoice email processing:', error);
    throw error;
  }
}
