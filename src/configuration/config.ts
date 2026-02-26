import dotenv from "dotenv";
dotenv.config();

import { Queue } from 'bullmq';
import Redis from 'ioredis';

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
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`🔄 Redis reconnecting... (attempt ${times}, delay ${delay}ms)`);
    return delay;
  },
});

// Handle Redis connection events
redisConnection.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisConnection.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redisConnection.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

redisConnection.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
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
const SERVER_ID = process.env.QUEUE_NAME || process.env.QUEUE_NAME || 'default';
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