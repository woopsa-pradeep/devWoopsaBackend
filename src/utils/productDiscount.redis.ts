import { redisConnection, PRODUCT_DISCOUNT_QUEUE_NAME } from '../configuration/config';
import moment from 'moment';

/**
 * Get product discount from Redis by ItemNumber
 * @param itemNumber - The item number to get discount for
 * @returns Discount object or null if not found
 */
export const getProductDiscountFromRedis = async (itemNumber: number): Promise<any | null> => {
  try {
    const key = `${PRODUCT_DISCOUNT_QUEUE_NAME}:item:${itemNumber}`;
    const discountData = await redisConnection.get(key);
    
    if (!discountData) {
      return null;
    }
    
    return JSON.parse(discountData);
  } catch (error: any) {
    console.error(`Error fetching discount from Redis for item ${itemNumber}:`, error);
    return null;
  }
};

/**
 * Get all discounts for a specific item from Redis
 * @param itemNumber - The item number to get all discounts for
 * @returns Array of discount objects or empty array
 */
export const getAllProductDiscountsForItemFromRedis = async (itemNumber: number): Promise<any[]> => {
  try {
    const key = `${PRODUCT_DISCOUNT_QUEUE_NAME}:item:${itemNumber}:all`;
    const discountData = await redisConnection.get(key);
    
    if (!discountData) {
      return [];
    }
    
    return JSON.parse(discountData);
  } catch (error: any) {
    console.error(`Error fetching all discounts from Redis for item ${itemNumber}:`, error);
    return [];
  }
};

/**
 * Get all active product discounts from Redis
 * @returns Array of all active discount objects
 */
export const getAllProductDiscountsFromRedis = async (): Promise<any[]> => {
  try {
    const key = `${PRODUCT_DISCOUNT_QUEUE_NAME}:all`;
    const discountData = await redisConnection.get(key);
    console.log('discountData', discountData);
    if (!discountData) {
      return [];
    }
    
    return JSON.parse(discountData);
  } catch (error: any) {
    console.error('Error fetching all discounts from Redis:', error);
    return [];
  }
};

/**
 * Get product discounts for a specific date from Redis
 * @param date - Date string in YYYY-MM-DD format (optional, defaults to today)
 * @returns Array of discount objects for that date
 */
export const getProductDiscountsByDateFromRedis = async (date?: string): Promise<any[]> => {
  try {
    const targetDate = date || moment().format('YYYY-MM-DD');
    const key = `${PRODUCT_DISCOUNT_QUEUE_NAME}:${targetDate}`;
    const discountData = await redisConnection.get(key);
    
    if (!discountData) {
      return [];
    }
    
    return JSON.parse(discountData);
  } catch (error: any) {
    console.error(`Error fetching discounts from Redis for date ${date}:`, error);
    return [];
  }
};

/**
 * Check if an item has an active discount and calculate the discounted price
 * @param itemNumber - The item number
 * @param quantity - The quantity being purchased
 * @param originalPrice - The original price of the item
 * @returns Object with discount info and final price, or null if no discount applies
 */
export const getDiscountedPriceFromRedis = async (
  itemNumber: number,
  quantity: number,
  originalPrice: number
): Promise<{
  hasDiscount: boolean;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number;
  finalPrice: number;
  originalPrice: number;
} | null> => {
  try {
    const discounts = await getAllProductDiscountsForItemFromRedis(itemNumber);
    
    if (discounts.length === 0) {
      return null;
    }
    
    // Find the best applicable discount (highest discount value where quantity requirement is met)
    let bestDiscount: any = null;
    let bestDiscountValue = 0;
    
    for (const discount of discounts) {
      if (quantity >= discount.quantity) {
        const discountValue = parseFloat(discount.discountValue.toString());
        if (discountValue > bestDiscountValue) {
          bestDiscount = discount;
          bestDiscountValue = discountValue;
        }
      }
    }
    
    if (!bestDiscount) {
      return null;
    }
    
    // Calculate discounted price
    let discountAmount = 0;
    let finalPrice = originalPrice;
    
    if (bestDiscount.discountType === 'percentage') {
      discountAmount = (originalPrice * bestDiscountValue) / 100;
      finalPrice = originalPrice - discountAmount;
    } else if (bestDiscount.discountType === 'flat') {
      discountAmount = bestDiscountValue;
      finalPrice = originalPrice - discountAmount;
    }
    
    return {
      hasDiscount: true,
      discountType: bestDiscount.discountType,
      discountValue: bestDiscountValue,
      discountAmount: Math.max(0, discountAmount), // Ensure non-negative
      finalPrice: Math.max(0, finalPrice), // Ensure non-negative
      originalPrice: originalPrice
    };
  } catch (error: any) {
    console.error(`Error calculating discounted price from Redis for item ${itemNumber}:`, error);
    return null;
  }
};
