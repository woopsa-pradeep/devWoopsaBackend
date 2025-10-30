import cron from 'node-cron';
import { NotificationScheduler } from '../models/postgres/notificationSchedular.model';
import { RetailerDevice } from '../models/postgres/device.model';
import { Op } from 'sequelize';
import logger from './logger';

/**
 * Notification Scheduler Utility
 * Handles scheduled notifications using cron jobs
 */

interface NotificationData {
  id: number;
  userId: number[];
  title: string;
  description: string;
  date: string;
  time: string;
  isActive: boolean;
  isExpire: boolean;
}

/**
 * Send notification to devices for given user IDs
 * @param userIds - Array of user IDs to send notifications to
 * @param title - Notification title
 * @param description - Notification description
 */
async function sendNotificationToUsers(
  userIds: number[],
  title: string,
  description: string
): Promise<void> {
  try {
    console.log('userIds', userIds);
    // Get device tokens for the specified users
    const devices = await RetailerDevice.findAll({
      where: {
        customerNumber: {
          [Op.in]: userIds
        },
        isActive: true,
        sessionActive: true,
        isAllow: true
      },
      attributes: ['deviceToken', 'customerNumber']
    });

    if (devices.length === 0) {
      logger.info(`No active devices found for users: ${userIds.join(', ')}`);
      return;
    }

    const deviceTokens = devices.map(device => device.deviceToken).filter(Boolean);

    // TODO: Implement actual notification sending logic
    // This is a placeholder - you can integrate with your preferred notification service
    // (Firebase FCM, OneSignal, etc.)
    
    logger.info(`Sending notification to ${deviceTokens.length} devices`);
    logger.info(`Title: ${title}`);
    logger.info(`Description: ${description}`);
    logger.info(`Device tokens: ${deviceTokens.join(', ')}`);

    // Example implementation (uncomment and modify as needed):
    /*
    for (const token of deviceTokens) {
      try {
        // await sendFCMNotification(token, title, description);
        // or use your preferred notification service
        logger.info(`Notification sent successfully to device: ${token}`);
      } catch (error) {
        logger.error(`Failed to send notification to device ${token}:`, error);
      }
    }
    */

  } catch (error) {
    logger.error('Error sending notifications to users:', error);
  }
}

/**
 * Check and process scheduled notifications
 * This function runs every minute via cron
 */
async function processScheduledNotifications(): Promise<void> {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format

    logger.info(`Checking scheduled notifications for ${currentDate} at ${currentTime}`);

    // Find notifications that are scheduled for the current date and time
    const scheduledNotifications = await NotificationScheduler.findAll({
      where: {
        date: currentDate,
        time: currentTime,
        isActive: true,
        isExpire: false
      }
    });

    if (scheduledNotifications.length === 0) {
      logger.info('No notifications scheduled for current time');
      return;
    }

    logger.info(`Found ${scheduledNotifications.length} notifications to process`);

    // Process each scheduled notification
    for (const notification of scheduledNotifications) {
      try {
        const notificationData = notification.toJSON() as NotificationData;
        
        logger.info(`Processing notification ID: ${notificationData.id}`);
        
        // Send notification to users
        await sendNotificationToUsers(
          notificationData.userId,
          notificationData.title,
          notificationData.description
        );

        // Mark notification as expired
        await notification.update({
          isExpire: true
        });

        logger.info(`Notification ID ${notificationData.id} processed and marked as expired`);

      } catch (error) {
        logger.error(`Error processing notification ID ${notification.id}:`, error);
      }
    }

  } catch (error) {
    logger.error('Error in processScheduledNotifications:', error);
  }
}

/**
 * Start the notification scheduler cron job
 * Runs every minute to check for scheduled notifications
 */
export function startNotificationScheduler(): void {
  logger.info('Starting notification scheduler cron job...');
  logger.info('Notification scheduler cron job started successfully');
  // Schedule cron job to run every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledNotifications();
    } catch (error) {
      logger.error('Error in notification scheduler cron job:', error);
    }
  }, {
    timezone: 'UTC'
  });

  logger.info('Notification scheduler cron job started successfully');
}

/**
 * Stop the notification scheduler cron job
 */
export function stopNotificationScheduler(): void {
  logger.info('Stopping notification scheduler cron job...');
  // Note: In a real implementation, you might want to store the cron job reference
  // and use it to stop the job. For now, this is a placeholder.
  logger.info('Notification scheduler cron job stopped');
}

/**
 * Get all active scheduled notifications
 * @returns Promise<NotificationData[]>
 */
export async function getActiveScheduledNotifications(): Promise<NotificationData[]> {
  try {
    const notifications = await NotificationScheduler.findAll({
      where: {
        isActive: true,
        isExpire: false
      },
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    return notifications.map(notification => notification.toJSON() as NotificationData);
  } catch (error) {
    logger.error('Error fetching active scheduled notifications:', error);
    throw error;
  }
}

/**
 * Get scheduled notifications for a specific user
 * @param userId - User ID to get notifications for
 * @returns Promise<NotificationData[]>
 */
export async function getUserScheduledNotifications(userId: number): Promise<NotificationData[]> {
  try {
    const notifications = await NotificationScheduler.findAll({
      where: {
        userId: {
          [Op.contains]: [userId]
        },
        isActive: true,
        isExpire: false
      },
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    return notifications.map(notification => notification.toJSON() as NotificationData);
  } catch (error) {
    logger.error(`Error fetching scheduled notifications for user ${userId}:`, error);
    throw error;
  }
} 