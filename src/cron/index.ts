import cron from 'node-cron';
import { bulkUpdateRetailers, updateRetailerOrderDate } from './retailer.cron';
import {  getUpcomingNotifications } from './notificationSchedular.cron';
import { processFuturePricingUpdates } from './futurePricing.cron';

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
    

    
    
  };
  