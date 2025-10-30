// src/services/fcm.service.ts
import admin from 'firebase-admin';
import path from 'path';
import { ServiceAccount } from 'firebase-admin';

const serviceAccount = require(path.join(__dirname, '../firebase/config.json')) as ServiceAccount;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

interface SendNotificationOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}


interface SendMultiNotificationOptions {
  tokens: string[]; // multiple tokens
  title: string;
  body: string;
  data?: { [key: string]: string };
}

export async function sendFCMNotification({
  token,
  title,
  body,
  data = {},
}: SendNotificationOptions): Promise<void> {
  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ FCM Notification sent successfully:', response);
  } catch (error) {
    console.error('❌ FCM Notification Error:', error);
    throw error;
  }
}

export async function sendMultiFCMNotification({
  tokens,
  title,
  body,
  data = {},
}: SendMultiNotificationOptions): Promise<void> {
  try {
    if (!tokens || tokens.length === 0) {
      console.warn('⚠️ No tokens provided for FCM notification.');
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ FCM sent to ${response.successCount} of ${tokens.length} devices.`);

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Failure for token[${idx}]: ${tokens[idx]} - ${resp.error}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ FCM Notification Error:', error);
    throw error;
  }
}