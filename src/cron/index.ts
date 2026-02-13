import cron from 'node-cron';
import { bulkUpdateRetailers, updateRetailerOrderDate } from './retailer.cron';
import {  getUpcomingNotifications } from './notificationSchedular.cron';
import { processFuturePricingUpdates } from './futurePricing.cron';
import { activateTradeShows, expireTradeShows } from './tradeShow.cron';

// cron.ts
export const startCronJobs = () => {
    console.log('Cron started');
    
    // Start retailer bulk update cron job (runs daily at 00:30 UTC)
    cron.schedule('30 0 * * *', async () => {
      try {
        console.log('[Cron] Starting retailer bulk update...');
        await bulkUpdateRetailers();
        await updateRetailerOrderDate();
        console.log('[Cron] Retailer update completed.');
      } catch (error) {
        console.error('[Cron] Error during retailer update:', error);
      }
    }, {
      timezone: 'UTC'
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

    // Future Pricing update cron job (runs every hour)
    cron.schedule('30 0 * * *', async () => {
      try {
        console.log('[Cron] Starting future pricing updates...');
        await processFuturePricingUpdates();
        console.log('[Cron] Future pricing updates completed.');
      } catch (error) {
        console.error('[Cron] Error during future pricing updates:', error);
      }
    });

    // TradeShow status update cron job (runs daily at 1:00 AM)
    cron.schedule('0 1 * * *', async () => {
      try {
        console.log('[Cron] Starting trade show status updates...');
        await activateTradeShows();
        await expireTradeShows();
        console.log('[Cron] Trade show status updates completed.');
      } catch (error) {
        console.error('[Cron] Error during trade show status updates:', error);
      }
    }, {
      timezone: 'UTC'
    });
    

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
  