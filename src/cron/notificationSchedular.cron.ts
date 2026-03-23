import moment from 'moment';
import { Op } from 'sequelize';
import { NotificationScheduler } from '../models/postgres/notificationSchedular.model';
import { RetailerDevice } from '../models/postgres/device.model';
import { sendMultiFCMNotification } from '../utils/sentNotification';
import { Notifications } from '../models/postgres/notification.model';

export const getUpcomingNotifications = async () => {
  const now = moment();
  const today = now.format('YYYY-MM-DD'); // current date
  const currentTime = now.format('HH:mm:ss'); // current time
  const fiveMinutesLater = now.add(5, 'minutes').format('HH:mm:ss'); // current + 5 minutes

  try {
    const notifications = await NotificationScheduler.findAll({
      where: {
        date: today,
        isActive: true,
        isExpire: false,
        time: {
          [Op.between]: [currentTime, fiveMinutesLater],
        },
      },
      raw: true,
    });

    console.log(`Found ${notifications.length} notifications to send:`, notifications);

    for (const notification of notifications) {
      await sendNotification(notification);
    }
    return notifications;
  } catch (error) {
    console.error('Error fetching upcoming notifications:', error);
    return [];
  }
};

async function sendNotification(notification: any) {
  try {
    if (notification.isExpire) {
      console.log(` Notification ${notification.id} already expired. Skipping.`);
      return;
    }
    // Get device tokens for all users in the notification
    const deviceTokens = [];

    for (const userId of notification.userId) {
      const userTokens = await RetailerDevice.findAll({
        where: {
          customerNumber: userId,
          isActive: true,
          isAllow: true
        },
        attributes: ['deviceToken'],
        order: [['createdAt', 'DESC']],
      });
      console.log(`User ${userId} has ${userTokens.length} active device tokens.`);

      await Notifications.create({
        userNumber: userId.toString(),
        title: notification.title,
        description: notification.description,
      });
      // Filter out empty or null device tokens
      const tokens = userTokens
        .map(device => device.deviceToken)
        .filter(token => token && token.trim() !== '');
      deviceTokens.push(...tokens);
    }

    if (deviceTokens.length === 0) {
      console.log(`No active device tokens found for users: ${notification.userId.join(', ')}`);
      return;
    }

    await sendMultiFCMNotification({
      tokens: deviceTokens,
      title: notification.title,
      body: notification.description,
    });
    console.log(`Successfully sent notification to ${deviceTokens.length} devices`);

    let UserNumber = deviceTokens[0];

    console.log(notification, 'notification');
    // Mark as expired after sending
    await NotificationScheduler.update(
      { isExpire: true },
      { where: { id: notification.id } }
    );
    console.log(`✅ Marked schedule ${notification.id} as expired`);

  } catch (error) {
    console.error(`❌ Error sending notification for schedule ${notification.id}:`, error);
  }
}

