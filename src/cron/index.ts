import cron from 'node-cron';
import { bulkUpdateRetailers, updateRetailerOrderDate } from './retailer.cron';
import {  getUpcomingNotifications } from './notificationSchedular.cron';
import { processFuturePricingUpdates } from './futurePricing.cron';
import { activateTradeShows, expireTradeShows } from './tradeShow.cron';
import { syncProductDiscountsToRedis } from './productDiscount.cron';
import { processInvoiceEmails } from './invoiceEmail.cron';
import { processCustomerBalanceEmails } from './customerBalance.cron';

// cron.ts
export const startCronJobs = () => {
    console.log('Cron started');
    
    // Start retailer bulk update cron job (runs daily at 00:30 AM Eastern Time)
    cron.schedule('30 0 * * *', async () => {
      try {
        console.log('[Cron] Starting retailer bulk update...');
        await bulkUpdateRetailers();
        await updateRetailerOrderDate();
        console.log('[Cron] Retailer update completed.');
      } catch (error) {
        console.error('[Cron] Error during retailer update:', error);
      }
    });
    
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('[Cron] Starting notification scheduler...');
        await getUpcomingNotifications();
        console.log('[Cron] Notification scheduler completed.');
      } catch (error) {
        console.error('[Cron] Error during notification scheduler:', error);
      }
    });

    // TradeShow status update cron job (runs daily at 00:45 AM Eastern Time)
    cron.schedule('45 0 * * *', async () => {
      try {
        console.log('[Cron] Starting trade show status updates...');
        await activateTradeShows();
        await expireTradeShows();
        console.log('[Cron] Trade show status updates completed.');
      } catch (error) {
        console.error('[Cron] Error during trade show status updates:', error);
      }
    });


    // Future Pricing update cron job (runs daily at 01:00 AM Eastern Time)
    cron.schedule('0 1 * * *', async () => {
      try {
        console.log('[Cron] Starting future pricing updates...');
        await processFuturePricingUpdates();
        console.log('[Cron] Future pricing updates completed.');
      } catch (error) {
        console.error('[Cron] Error during future pricing updates:', error);
      }
    });

    
    // ProductDiscount sync to Redis cron job (runs daily at 02:00 AM Eastern Time)
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('[Cron] Starting product discount sync to Redis...');
        await syncProductDiscountsToRedis();
        console.log('[Cron] Product discount sync to Redis completed.');
      } catch (error) {
        console.error('[Cron] Error during product discount sync to Redis:', error);
      }
    });

    // Invoice Email cron job (runs every hour from 2 PM to 10 PM Eastern Time)
    cron.schedule('0 14-21 * * *', async () => {
      try {
        console.log('[Cron] Starting invoice email processing...');
        await processInvoiceEmails();
        console.log('[Cron] Invoice email processing completed.');
      } catch (error) {
        console.error('[Cron] Error during invoice email processing:', error);
      }
    });

  

    // Customer balance email cron (runs daily at 2:30 AM Eastern Time)
    cron.schedule('30 2 * * *', async () => {
      try {
        console.log('[Cron] Starting customer balance email processing...');
        await processCustomerBalanceEmails();
        console.log('[Cron] Customer balance email processing completed.');
      } catch (error) {
        console.error('[Cron] Error during customer balance email processing:', error);
      }
    });


    // cron.schedule('*/2 * * * *', async () => {
    //   try {
    //     console.log('[Cron] Starting customer balance email processing...');
    //     await processCustomerBalanceEmails();
    //     console.log('[Cron] Customer balance email processing completed.');
    //   } catch (error) {
    //     console.error('[Cron] Error during customer balance email processing:', error);
    //   }
    // }, {
    //   timezone: 'America/New_York'
    // });


    // cron.schedule('*/2 * * * *', async () => {
    //   try {
    //     console.log('[Cron] Starting product discount sync to Redis...');
    //     await syncProductDiscountsToRedis();
    //     console.log('[Cron] Product discount sync to Redis completed.');
    //   } catch (error) {
    //     console.error('[Cron] Error during product discount sync to Redis:', error);
    //   }
    // }, {
    //   timezone: 'UTC'
    // });

    // cron.schedule('* * * * *', async () => {
    //   try {
    //     console.log('[Cron] Starting trade show status updates...');
    //     await activateTradeShows();
    //     await expireTradeShows();
    //     console.log('[Cron] Trade show status updates completed.');
    //   } catch (error) {
    //     console.error('[Cron] Error during trade show status updates:', error);
    //   }
    // }, {
    //   timezone: 'UTC'
    // });
    
    
  };
  