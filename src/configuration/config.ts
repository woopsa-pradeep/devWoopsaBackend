import dotenv from "dotenv";
dotenv.config();

import { Queue } from 'bullmq';

export const config = {
  azureConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  hostURL: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  masterImageUrl:process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  productFolder:"product_image",
  containerName: "product-images"
};

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
};

export const EMAIL_QUEUE_NAME = 'email-queue';
export const EMAIL_NOTIFICATION_QUEUE_NAME = 'email-notification';
const queueName = process.env.QUEUE_NAME || 'default';
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  prefix: queueName,
});

export const emailNotificationQueue = new Queue(EMAIL_NOTIFICATION_QUEUE_NAME, {
  connection,
  prefix: queueName,
});