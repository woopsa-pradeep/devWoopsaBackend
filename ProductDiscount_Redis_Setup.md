# ProductDiscount Redis Setup

## Overview
ProductDiscount data को Redis में store किया जाता है ताकि fast access हो सके। एक cron job हर रात 1 AM पर automatically active discounts को Redis में sync करता है।

## Features

### 1. Automatic Cron Job
- **Schedule**: हर रात 1:00 AM (UTC timezone)
- **Function**: `syncProductDiscountsToRedis()`
- **Location**: `src/cron/productDiscount.cron.ts`
- **What it does**:
  - Active discounts को query करता है (जहाँ आज की date startDate और endDate के बीच है)
  - Old Redis keys को clear करता है
  - नए discounts को Redis में store करता है

### 2. Redis Key Structure

Redis में data multiple keys में store होता है:

- `productDiscounts:all` - सभी active discounts (JSON array)
- `productDiscounts:YYYY-MM-DD` - Specific date के discounts
- `productDiscount:${ItemNumber}` - Best discount for specific item
- `productDiscount:${ItemNumber}:all` - सभी discounts for specific item

**Note**: सभी keys 24 hours (86400 seconds) के बाद automatically expire हो जाती हैं।

### 3. Helper Functions

Redis से data fetch करने के लिए helper functions:

**Location**: `src/utils/productDiscount.redis.ts`

#### Available Functions:

1. **`getProductDiscountFromRedis(itemNumber: number)`**
   - Single item के लिए best discount return करता है
   - Returns: Discount object या null

2. **`getAllProductDiscountsForItemFromRedis(itemNumber: number)`**
   - Single item के सभी discounts return करता है
   - Returns: Array of discount objects

3. **`getAllProductDiscountsFromRedis()`**
   - सभी active discounts return करता है
   - Returns: Array of all discount objects

4. **`getProductDiscountsByDateFromRedis(date?: string)`**
   - Specific date के discounts return करता है
   - Date format: YYYY-MM-DD (optional, defaults to today)
   - Returns: Array of discount objects

5. **`getDiscountedPriceFromRedis(itemNumber: number, quantity: number, originalPrice: number)`**
   - Discounted price calculate करता है based on quantity
   - Returns: Object with discount info और final price, या null

### 4. Manual Sync Endpoint

अगर आप manually Redis sync करना चाहते हैं:

**Endpoint**: `POST /productDiscounts/syncToRedis`
**Method**: POST
**Auth**: Manager/Sales role required

**Example Request**:
```bash
POST /api/manager/productDiscounts/syncToRedis
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product discounts synced to Redis successfully",
  "data": {
    "success": true,
    "totalDiscounts": 25,
    "uniqueItems": 15,
    "date": "2024-01-15"
  }
}
```

### 5. Automatic Sync on CRUD Operations

जब भी आप discount create, update, या delete करते हैं, Redis automatically sync हो जाता है (background में, response को block नहीं करता)।

## Usage Examples

### Example 1: Get discount for an item
```typescript
import { getProductDiscountFromRedis } from '../utils/productDiscount.redis';

const discount = await getProductDiscountFromRedis(12345);
if (discount) {
  console.log('Discount found:', discount);
  // { id: 1, ItemNumber: 12345, discountType: 'percentage', discountValue: 15.50, ... }
}
```

### Example 2: Calculate discounted price
```typescript
import { getDiscountedPriceFromRedis } from '../utils/productDiscount.redis';

const originalPrice = 100.00;
const quantity = 10;

const discountInfo = await getDiscountedPriceFromRedis(12345, quantity, originalPrice);
if (discountInfo) {
  console.log('Original Price:', discountInfo.originalPrice);
  console.log('Discount Amount:', discountInfo.discountAmount);
  console.log('Final Price:', discountInfo.finalPrice);
  // Output:
  // Original Price: 100.00
  // Discount Amount: 15.50
  // Final Price: 84.50
}
```

### Example 3: Get all discounts for today
```typescript
import { getAllProductDiscountsFromRedis } from '../utils/productDiscount.redis';

const allDiscounts = await getAllProductDiscountsFromRedis();
console.log(`Found ${allDiscounts.length} active discounts`);
```

### Example 4: Get discounts for specific date
```typescript
import { getProductDiscountsByDateFromRedis } from '../utils/productDiscount.redis';

const discounts = await getProductDiscountsByDateFromRedis('2024-01-15');
console.log(`Found ${discounts.length} discounts for 2024-01-15`);
```

## Cron Job Details

**Schedule**: `0 1 * * *` (1:00 AM daily, UTC timezone)

**File**: `src/cron/index.ts`

Cron job automatically start होता है जब server start होता है (क्योंकि `startCronJobs()` function `src/index.ts` में call होता है)।

## Important Notes

1. **Timezone**: Cron job UTC timezone में run होता है। अगर आपको local time चाहिए, timezone change करें।

2. **Redis Expiration**: सभी keys 24 hours के बाद expire हो जाती हैं, लेकिन cron job हर रात नए data से update कर देता है।

3. **Performance**: Redis से data fetch करना database query से बहुत fast है, especially high-traffic scenarios में।

4. **Fallback**: अगर Redis में data नहीं मिला, तो आप directly database से query कर सकते हैं।

5. **Multiple Discounts**: अगर एक item के लिए multiple discounts हैं, तो `getProductDiscountFromRedis()` best discount (highest discountValue) return करता है।

## Testing

Manual sync test करने के लिए:
```bash
curl -X POST http://localhost:3000/api/manager/productDiscounts/syncToRedis \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Redis में data check करने के लिए:
```bash
redis-cli
> GET productDiscounts:all
> GET productDiscount:12345
> KEYS productDiscount:*
```

## Troubleshooting

1. **Redis connection error**: Check Redis server is running और `REDIS_HOST` और `REDIS_PORT` environment variables सही हैं।

2. **No data in Redis**: 
   - Manual sync endpoint try करें
   - Check करें कि active discounts database में exist करते हैं
   - Check cron job logs

3. **Stale data**: 
   - Redis keys 24 hours में expire हो जाती हैं
   - Manual sync करें या cron job का wait करें
