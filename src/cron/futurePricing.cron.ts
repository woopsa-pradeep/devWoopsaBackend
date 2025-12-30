import moment from 'moment';
import { Op } from 'sequelize';
import { FuturePricing } from '../models/postgres/futurePricing.model';
import { Inventory } from '../models/mmsql/inventory.model';
import { InventoryPriceHistory } from '../models/postgres/inventoryPriceHistory.model';
import { Distributor } from '../models/mmsql/distributor.model';
import { hasPriceChange } from '../utils/helper';
import { sendEmail } from '../utils/sendMail';

/**
 * Process future pricing updates that are due
 * Checks all FuturePricing records where isApplied = false
 * and effectiveAt date is today or in the past
 * Updates the Inventory table with fields from changedFields
 */
export const processFuturePricingUpdates = async () => {
  try {
    const today = moment().startOf('day').toDate();
    
    console.log(`[FuturePricing Cron] Checking for future pricing updates due on or before ${moment(today).format('YYYY-MM-DD')}`);

    // Find all future pricing records that are not applied and due today or in the past
    const futurePricings = await FuturePricing.findAll({
      where: {
        isApplied: false,
        effectiveAt: {
          [Op.lte]: today, // effectiveAt is less than or equal to today
        },
      },
      raw: true,
    });

    console.log(`[FuturePricing Cron] Found ${futurePricings.length} future pricing records to process`);

    if (futurePricings.length === 0) {
      return {
        processed: 0,
        updated: 0,
        errors: [],
      };
    }

    let processedCount = 0;
    let updatedCount = 0;
    const errors: Array<{ id: number; itemNumber: number; error: string }> = [];
    const updatedItems: Array<{
      itemNumber: number;
      description?: string;
      changedFields: Record<string, { oldValue: any; newValue: any }>;
    }> = [];

    // Process each future pricing record
    for (const futurePricing of futurePricings) {
      try {
        const { id, itemNumber, changedFields, changedBy, changedUserId } = futurePricing;

        // Merge all objects in the changedFields array into a single update object
        const updateFields: Record<string, any> = {};
        if (Array.isArray(changedFields) && changedFields.length > 0) {
          changedFields.forEach((fieldObj: Record<string, any>) => {
            Object.assign(updateFields, fieldObj);
          });
        } else {
          console.warn(`[FuturePricing Cron] FuturePricing ID ${id} has invalid changedFields format`);
          continue;
        }

        if (Object.keys(updateFields).length === 0) {
          console.warn(`[FuturePricing Cron] FuturePricing ID ${id} has no fields to update`);
          // Mark as applied even if no fields to update
          await FuturePricing.update(
            { isApplied: true },
            { where: { id } }
          );
          processedCount++;
          continue;
        }

        // Check if inventory item exists
        const inventoryItem = await Inventory.findByPk(itemNumber);
        if (!inventoryItem) {
          const errorMsg = `Inventory item ${itemNumber} not found`;
          console.error(`[FuturePricing Cron] ${errorMsg} for FuturePricing ID ${id}`);
          errors.push({
            id,
            itemNumber,
            error: errorMsg,
          });
          continue;
        }

        // Capture old values for each field that will be changed (for history logging)
        const oldValuesMap: Record<string, any> = {};
        Object.keys(updateFields).forEach((fieldName) => {
          const fieldValue = (inventoryItem as any).getDataValue(fieldName);
          if (fieldValue !== undefined && fieldValue !== null) {
            oldValuesMap[fieldName] = fieldValue;
          }
        });

        // Prepare update data with metadata
        const updateData: Record<string, any> = {
          ...updateFields,
          Date_LastChange: new Date(),
        };

        // Set Date_LastChangeUser if changedUserId is available
        if (changedUserId) {
          updateData.Date_LastChangeUser = changedUserId;
        }

        // Check if price fields are being changed and update price modification metadata
        if (hasPriceChange(updateFields)) {
          updateData.PriceCostModifiedDate = new Date();
          if (changedUserId) {
            updateData.PriceCostModifiedUser = changedUserId;
          }
        }

        // Update the Inventory table
        const [affectedRows] = await Inventory.update(updateData, {
          where: { Item_Number: itemNumber },
        });

        if (affectedRows > 0) {
          console.log(
            `[FuturePricing Cron] ✅ Updated Inventory Item ${itemNumber} with fields: ${Object.keys(updateFields).join(', ')}`
          );

          // Create separate history entry for each changed field
          const historyEntries = [];
          const changedFieldsMap: Record<string, { oldValue: any; newValue: any }> = {};
          
          for (const fieldName of Object.keys(updateFields)) {
            const oldValue = oldValuesMap[fieldName] ?? null;
            const newValue = updateFields[fieldName];

            changedFieldsMap[fieldName] = { oldValue, newValue };

            historyEntries.push({
              itemNumber: itemNumber,
              changedAt: new Date(),
              oldValues: { [fieldName]: oldValue },
              newValues: { [fieldName]: newValue },
              changedBy: changedBy,
              changedByUserId: changedUserId ?? null,
              source: 'future_pricing',
            });
          }

          // Bulk create all history entries
          try {
            await InventoryPriceHistory.bulkCreate(historyEntries);
            console.log(
              `[FuturePricing Cron] 📝 Logged ${historyEntries.length} price history entries for Item ${itemNumber}`
            );
          } catch (historyError: any) {
            // Log error but don't fail the update
            console.error(
              `[FuturePricing Cron] ⚠️ Failed to log history for Item ${itemNumber}:`,
              historyError.message
            );
          }

          // Store updated item info for email notification
          const itemDescription = (inventoryItem as any).getDataValue('Description') || 'N/A';
          updatedItems.push({
            itemNumber: itemNumber,
            description: itemDescription,
            changedFields: changedFieldsMap,
          });

          // Mark future pricing as applied
          await FuturePricing.update(
            { isApplied: true },
            { where: { id } }
          );

          updatedCount++;
          processedCount++;
        } else {
          const errorMsg = `Failed to update Inventory item ${itemNumber}`;
          console.error(`[FuturePricing Cron] ${errorMsg} for FuturePricing ID ${id}`);
          errors.push({
            id,
            itemNumber,
            error: errorMsg,
          });
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        console.error(
          `[FuturePricing Cron] ❌ Error processing FuturePricing ID ${futurePricing.id}:`,
          errorMsg
        );
        errors.push({
          id: futurePricing.id,
          itemNumber: futurePricing.itemNumber,
          error: errorMsg,
        });
      }
    }

    console.log(
      `[FuturePricing Cron] Completed: ${processedCount} processed, ${updatedCount} updated, ${errors.length} errors`
    );

    // Send email notification to distributor if items were updated
    if (updatedItems.length > 0) {
      try {
        await sendPriceChangeNotificationEmail(updatedItems, updatedCount, processedCount);
      } catch (emailError: any) {
        console.error(
          '[FuturePricing Cron] ⚠️ Failed to send email notification:',
          emailError.message
        );
        // Don't fail the entire process if email fails
      }
    }

    return {
      processed: processedCount,
      updated: updatedCount,
      errors,
      updatedItems: updatedItems.length,
    };
  } catch (error) {
    console.error('[FuturePricing Cron] ❌ Fatal error in processFuturePricingUpdates:', error);
    throw error;
  }
};

/**
 * Send email notification to distributor about price changes
 */
const sendPriceChangeNotificationEmail = async (
  updatedItems: Array<{
    itemNumber: number;
    description?: string;
    changedFields: Record<string, { oldValue: any; newValue: any }>;
  }>,
  totalUpdated: number,
  totalProcessed: number
) => {
  try {
    // Get distributor information
    const distributor = await Distributor.findOne({});
    if (!distributor || !distributor.D_Email) {
      console.warn('[FuturePricing Cron] No distributor email found, skipping email notification');
      return;
    }

    const distributorName = distributor.D_Name || 'Distributor';
    const distributorEmail = distributor.D_Email;

    // Generate email HTML
    const emailHtml = generatePriceChangeNotificationEmail(
      distributorName,
      updatedItems,
      totalUpdated,
      totalProcessed
    );

    // Send email
    await sendEmail({
      to: distributorEmail,
      subject: `Price Update Notification - ${updatedItems.length} Item(s) Updated`,
      html: emailHtml,
    });

    console.log(
      `[FuturePricing Cron] 📧 Sent price change notification email to ${distributorEmail}`
    );
  } catch (error: any) {
    console.error('[FuturePricing Cron] Error sending price change email:', error);
    throw error;
  }
};

/**
 * Generate HTML email template for price change notification
 */
const generatePriceChangeNotificationEmail = (
  distributorName: string,
  updatedItems: Array<{
    itemNumber: number;
    description?: string;
    changedFields: Record<string, { oldValue: any; newValue: any }>;
  }>,
  totalUpdated: number,
  totalProcessed: number
): string => {
  const currentDate = moment().format('MMMM DD, YYYY [at] hh:mm A');
  
  // Generate items table rows
  let itemsTableRows = '';
  updatedItems.forEach((item) => {
    const fieldsRows = Object.entries(item.changedFields)
      .map(([fieldName, values]) => {
        const oldVal = values.oldValue !== null && values.oldValue !== undefined 
          ? typeof values.oldValue === 'number' 
            ? values.oldValue.toFixed(2) 
            : values.oldValue 
          : 'N/A';
        const newVal = values.newValue !== null && values.newValue !== undefined 
          ? typeof values.newValue === 'number' 
            ? values.newValue.toFixed(2) 
            : values.newValue 
          : 'N/A';
        
        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${fieldName}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${oldVal}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${newVal}</td>
          </tr>
        `;
      })
      .join('');

    itemsTableRows += `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${item.itemNumber}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${item.description || 'N/A'}</td>
        <td style="padding: 12px; border: 1px solid #ddd;" colspan="3">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 6px; border: 1px solid #ddd; text-align: left;">Field</th>
                <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">Old Value</th>
                <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">New Value</th>
              </tr>
            </thead>
            <tbody>
              ${fieldsRows}
            </tbody>
          </table>
        </td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Price Update Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 900px;
          margin: auto;
          background: #ffffff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #3C7795;
          color: white;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .summary {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 30px;
        }
        .summary-item {
          display: inline-block;
          margin-right: 30px;
          font-size: 16px;
        }
        .summary-item strong {
          color: #3C7795;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #3C7795;
          color: white;
          padding: 12px;
          text-align: left;
          border: 1px solid #ddd;
        }
        td {
          padding: 12px;
          border: 1px solid #ddd;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Price Update Notification</h1>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <strong>Total Items Updated:</strong> ${totalUpdated}
          </div>
          <div class="summary-item">
            <strong>Total Processed:</strong> ${totalProcessed}
          </div>
          <div class="summary-item">
            <strong>Date:</strong> ${currentDate}
          </div>
        </div>

        <h2 style="color: #3C7795; margin-top: 30px;">Updated Items Details</h2>
        <table>
          <thead>
            <tr>
              <th>Item Number</th>
              <th>Description</th>
              <th colspan="3">Price Changes</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>This is an automated notification from the Future Pricing System.</p>
          <p>&copy; ${new Date().getFullYear()} ${distributorName} — All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

