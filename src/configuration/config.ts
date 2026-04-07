import dotenv from "dotenv";
dotenv.config();

import { Queue } from 'bullmq';
import Redis from 'ioredis';

/** Set `REDIS_WORKERS_ENABLED=false` when Redis is not running locally to avoid BullMQ worker spam. */
export const REDIS_WORKERS_ENABLED = process.env.REDIS_WORKERS_ENABLED !== 'false';
/** Set `REDIS_BULL_BOARD_ENABLED=false` to disable `/admin/queues` when Redis is unavailable. */
export const REDIS_BULL_BOARD_ENABLED = process.env.REDIS_BULL_BOARD_ENABLED !== 'false';

const redisMaxReconnectAttempts = (() => {
  const raw = process.env.REDIS_MAX_RECONNECT_ATTEMPTS;
  if (raw === undefined || raw === '') return 10;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) return 10;
  return n;
})();

export const config = {
  azureConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  hostURL: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  masterImageUrl:process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  productFolder:"product_image",
  containerName: "product-images"
};

// Create IORedis connection instance (required by BullMQ)
export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: false,
  retryStrategy: (times) => {
    if (redisMaxReconnectAttempts > 0 && times > redisMaxReconnectAttempts) {
      console.warn(
        `⚠️ Redis: stopped reconnecting after ${redisMaxReconnectAttempts} attempts. Start Redis or set REDIS_HOST / REDIS_PORT. ` +
          `To silence BullMQ errors without Redis, set REDIS_WORKERS_ENABLED=false`
      );
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    if (times === 1 || times % 5 === 0) {
      console.log(
        `🔄 Redis reconnecting... (attempt ${times}${redisMaxReconnectAttempts ? `/${redisMaxReconnectAttempts}` : ''}, delay ${delay}ms)`
      );
    }
    return delay;
  },
});

let lastRedisErrorLogAt = 0;
const REDIS_ERROR_LOG_THROTTLE_MS = 30_000;

// Handle Redis connection events
redisConnection.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisConnection.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisConnection.on('error', (err) => {
  const now = Date.now();
  if (now - lastRedisErrorLogAt >= REDIS_ERROR_LOG_THROTTLE_MS) {
    lastRedisErrorLogAt = now;
    console.error('❌ Redis connection error:', err.message);
  }
});

redisConnection.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

// Test Redis connection
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redisConnection.ping();
    console.log('✅ Redis connection test successful');
    return true;
  } catch (error: any) {
    console.error('❌ Redis connection test failed:', error.message);
    return false;
  }
};

// Get server identifier from environment variable (e.g., 'cdt' or 'aimrok')
// This ensures each server only processes its own email jobs
const SERVER_ID = process.env.QUEUE_NAME || 'default';
console.log(`🖥️ Server ID: ${SERVER_ID} - Using server-specific queues`);

// Create server-specific queue names
export const EMAIL_QUEUE_NAME = `email-queue-${SERVER_ID}`;
export const EMAIL_NOTIFICATION_QUEUE_NAME = `email-notification-${SERVER_ID}`;
export const PRODUCT_DISCOUNT_QUEUE_NAME = `product-discount-${SERVER_ID}`;

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
});

export const emailNotificationQueue = new Queue(EMAIL_NOTIFICATION_QUEUE_NAME, {
  connection: redisConnection,
});

console.log(`📧 Email queues initialized: ${EMAIL_QUEUE_NAME}, ${EMAIL_NOTIFICATION_QUEUE_NAME}`);
console.log(`💰 Product Discount queue prefix: ${PRODUCT_DISCOUNT_QUEUE_NAME}`);