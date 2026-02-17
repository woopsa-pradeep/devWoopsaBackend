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

// export async function sendFCMNotification({
//   token,
//   title,
//   body,
//   data = {},
// }: SendNotificationOptions): Promise<void> {
//   try {
//     const message: admin.messaging.Message = {
//       token,
//       notification: {
//         title,
//         body,
//         // imageUrl: notification.metadata?.imageUrl || undefined,
//   //     token: "ewI1JpJHRkQErgQPgsZxYo:APA91bEJ3EkAzdh2Q0JUW6jDbNh75BtQiYLra9Wpc9403BMciuYDThFkCXs1Bwmbo1Zz1JJR1OYVt9bk_5ulfbiERS072B9EtJE1xPxpnE0i6q93h_O5cAA",
//   // notification: {
//   //   title: "Test Title",
//   //   body: "Test Body"
//   //     },
//   //     data: {
//   //             redirectScreen: notification.metadata?.redirectScreen || "",
//   //             linkUrl: notification.metadata?.linkUrl || "",
//   //             type: notification.metadata?.type || "",
//   //             extraData: JSON.stringify(notification.metadata?.extraData || {})
//             },
//       android: {
//         priority: 'high',
//       },
//       apns: {
//         payload: {
//           aps: {
//             sound: 'default',
//           },
//         },
//       },
//     };

//     const response = await admin.messaging().send(message);
//     console.log('✅ FCM Notification sent successfully:', response);
//   } catch (error) {
//     console.error('❌ FCM Notification Error:', error);
//     throw error;
//   }
// }

export async function sendFCMNotification({
  token,
  title,
  body,
  data = {},
}: SendNotificationOptions): Promise<void> {
  try {
    // Extract known properties first
    const imageUrl =
      typeof data.imageUrl === "string" ? data.imageUrl : undefined;

    // Convert all data values to string (FCM requirement)
    const stringifiedData: { [key: string]: string } = {};

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        stringifiedData[key] =
          typeof data[key] === "string"
            ? data[key]
            : JSON.stringify(data[key]);
      }
    });

    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: stringifiedData,
      android: {
        priority: "high",
        notification: {
          ...(imageUrl && { imageUrl }),
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            "mutable-content": 1,
          },
        },
        ...(imageUrl && {
          fcmOptions: { imageUrl },
        }),
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ FCM Notification sent successfully:", response);
  } catch (error) {
    console.error("❌ FCM Notification Error:", error);
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