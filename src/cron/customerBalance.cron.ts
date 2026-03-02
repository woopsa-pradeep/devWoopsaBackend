import { Op } from 'sequelize';
import moment from 'moment-timezone';

import { CustomerBalanceSetting } from '../models/postgres/customerBalance.model';
import { Customer } from '../models/mmsql/customer.model';
import { sendEmail } from '../utils/sendMail';
import { generateCustomerBalanceEmail } from '../view/emails';

/**
 * Cron job to send customer balance reminder emails.
 * Runs at 2:00 AM Eastern Time (scheduled in cron/index.ts).
 *
 * Logic:
 *  - Read CustomerBalanceSetting rows where sendMail = true
 *  - Check if today's weekday is included in days[]
 *  - If active, find all customers where C_Inactive = false and LastBalance > 0
 *  - For each customer with C_Email, send an email with their pending LastBalance
 */
export async function processCustomerBalanceEmails(): Promise<void> {
  try {
    console.log('[Customer Balance Cron] Starting customer balance email processing...');

    // Get current day name in Eastern Time (e.g. 'monday', 'tuesday', ...)
    const currentDay = moment.tz('America/New_York').format('dddd').toLowerCase();
    console.log('[Customer Balance Cron] Current Eastern day:', currentDay);

    // Load settings where sendMail is enabled
    const settings = await CustomerBalanceSetting.findAll({
      where: {
        sendMail: true,
      },
    });

    if (!settings || settings.length === 0) {
      console.log('[Customer Balance Cron] No active customer balance settings found. Skipping.');
      return;
    }

    // Check if at least one setting is active for today
    const isActiveToday = settings.some((setting: any) => {
      const days: string[] = Array.isArray(setting.days) ? setting.days : [];
      return days.map((d) => d.toLowerCase()).includes(currentDay);
    });

    if (!isActiveToday) {
      console.log('[Customer Balance Cron] No settings enabled for today. Skipping.');
      return;
    }

    console.log('[Customer Balance Cron] Settings active for today. Fetching customers...');

    // Find all active customers with a positive LastBalance
    const customers: any[] = await Customer.findAll({
      where: {
        C_Inactive: false,
        LastBalance: {
          [Op.gt]: 0,
        },
      },
      attributes: ['C_Number', 'C_Name', 'C_CoName', 'C_Email', 'LastBalance'],
    });

    if (!customers || customers.length === 0) {
      console.log('[Customer Balance Cron] No customers with pending balance found.');
      return;
    }

    console.log(`[Customer Balance Cron] Found ${customers.length} customers with pending balance.`);

    let sentCount = 0;
    let skippedNoEmail = 0;

    for (const customer of customers) {
      try {
        if (!customer.C_Email) {
          skippedNoEmail++;
          continue;
        }

        const name =
          customer.C_Name ||
          customer.C_CoName ||
          `Customer #${customer.C_Number}`;

        const balance = Number(customer.LastBalance || 0);
        if (balance <= 0) {
          continue;
        }

        const html = generateCustomerBalanceEmail(name, balance);

        const emailSent = await sendEmail({
          to: customer.C_Email,
          subject: 'Pending Balance Reminder',
          html,
        });

        if (emailSent) {
          sentCount++;
          console.log(
            `[Customer Balance Cron] ✅ Balance email sent to customer #${customer.C_Number} (${customer.C_Email})`
          );
        } else {
          console.log(
            `[Customer Balance Cron] ❌ Failed to send balance email to customer #${customer.C_Number} (${customer.C_Email})`
          );
        }
      } catch (error) {
        console.error(
          `[Customer Balance Cron] Error sending email to customer #${customer.C_Number}:`,
          error
        );
      }
    }

    console.log(
      `[Customer Balance Cron] Completed. Emails sent: ${sentCount}, skipped (no email): ${skippedNoEmail}`
    );
  } catch (error) {
    console.error(
      '[Customer Balance Cron] Fatal error in customer balance email processing:',
      error
    );
    throw error;
  }
}

