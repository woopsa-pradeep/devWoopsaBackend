import { Op } from 'sequelize';
import { ProductDiscount } from '../models/postgres/productDiscount.model';
import { redisConnection, PRODUCT_DISCOUNT_QUEUE_NAME } from '../configuration/config';
import moment from 'moment';

/**
 * Sync active product discounts to Redis
 * This function queries all active discounts for today and stores them in Redis
 */
export const syncProductDiscountsToRedis = async () => {
  try {
    console.log('[ProductDiscount Cron] Starting product discount sync to Redis...');
    
    const today = moment().format('YYYY-MM-DD');
    const todayDate = new Date(today);
    
    // Find all active discounts where today is between startDate and endDate
    const activeDiscounts = await ProductDiscount.findAll({
      where: {
        isActive: true,
        startDate: {
          [Op.lte]: todayDate
        },
        endDate: {
          [Op.gte]: todayDate
        }
      },
      raw: true
    });

    console.log(`[ProductDiscount Cron] Found ${activeDiscounts.length} active discounts for today`);

    // Use server-specific prefix to avoid conflicts with other Redis users
    const prefix = `${PRODUCT_DISCOUNT_QUEUE_NAME}:`;

    // Clear existing discount data for today (using server-specific prefix)
    const keys = await redisConnection.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redisConnection.del(...keys);
      console.log(`[ProductDiscount Cron] Cleared ${keys.length} old discount keys from Redis`);
    }

    // Group discounts by ItemNumber (in case there are multiple discounts for same item)
    const discountsByItem: { [key: number]: any[] } = {};
    
    for (const discount of activeDiscounts) {
      const itemNumber = discount.ItemNumber;
      if (!discountsByItem[itemNumber]) {
        discountsByItem[itemNumber] = [];
      }
      discountsByItem[itemNumber].push(discount);
    }

    // Store discounts in Redis with multiple key patterns for easy access (using server-specific prefix)
    const pipeline = redisConnection.pipeline();
    
    // Store all discounts as a single JSON object
    pipeline.set(`${prefix}all`, JSON.stringify(activeDiscounts), 'EX', 86400); // Expire in 24 hours
    
    // Store discounts by date
    pipeline.set(`${prefix}${today}`, JSON.stringify(activeDiscounts), 'EX', 86400);
    
    // Store discounts by ItemNumber for quick lookup
    for (const [itemNumber, discounts] of Object.entries(discountsByItem)) {
      // Store the best discount (highest discountValue) for each item
      const bestDiscount = discounts.reduce((best, current) => {
        const bestValue = parseFloat(best.discountValue.toString());
        const currentValue = parseFloat(current.discountValue.toString());
        return currentValue > bestValue ? current : best;
      });
      
      pipeline.set(
        `${prefix}item:${itemNumber}`,
        JSON.stringify(bestDiscount),
        'EX',
        86400
      );
      
      // Also store all discounts for this item
      pipeline.set(
        `${prefix}item:${itemNumber}:all`,
        JSON.stringify(discounts),
        'EX',
        86400
      );
    }

    await pipeline.exec();
    
    console.log(`[ProductDiscount Cron] Successfully synced ${activeDiscounts.length} discounts to Redis`);
    console.log(`[ProductDiscount Cron] Stored discounts for ${Object.keys(discountsByItem).length} unique items`);
    
    return {
      success: true,
      totalDiscounts: activeDiscounts.length,
      uniqueItems: Object.keys(discountsByItem).length,
      date: today
    };
  } catch (error: any) {
    console.error('[ProductDiscount Cron] Error syncing discounts to Redis:', error);
    throw error;
  }
};
