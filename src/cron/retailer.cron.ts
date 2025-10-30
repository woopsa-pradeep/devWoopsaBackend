import { Op } from 'sequelize';
import { RetailerDevice } from '../models/postgres/device.model';
import { Notifications } from '../models/postgres/notification.model';
import { Retailer } from '../models/postgres/retailer.model';
import { checkRegisterCustomer, getRegisterCustomer } from '../utils/helper';
import moment from 'moment';
import { sendMultiFCMNotification } from '../utils/sentNotification';


const getDayFromNumber = (dayNumber: number): string => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[dayNumber] || '';
};

export const bulkUpdateRetailers = async () => {
    return await Retailer.update(
        {
            todayOrderCount: 0
        },
        {
            where: {
                isActive: true
            }
        }
    );


};

export const updateRetailerOrderDate = async () => {
    const matchedCustomers: { customerNumber: number; dayName: string }[] = [];
  
    let retailers :any = await Retailer.findAll({
      where: {
        isActive: true,
      },
      attributes: ['Customer_Number'],
    });
  
    const currentDay = moment().format('dddd'); // e.g., "Wednesday"
  
    
    for (const retailer of retailers) {
      const isRegisterCustomer: any = await getRegisterCustomer(retailer.Customer_Number);
      if (isRegisterCustomer) {
        const dayName = getDayFromNumber(isRegisterCustomer.C_OrderDaySequence);
        if (dayName === currentDay) {
          matchedCustomers.push({
            customerNumber: retailer.Customer_Number,
            dayName,
          });
        }
      }
    }
  
    console.log(matchedCustomers, '✅ Matched Customers for today');
  
    if (matchedCustomers.length > 0) {
      const notifications = matchedCustomers.map(({ customerNumber, dayName }) => ({
        userNumber: customerNumber,
        title: 'Order Day',
        description: `It's ${dayName}! Get ready for your weekly order delivery`,
        isRead: false,
      }));
  
      console.log(notifications, '📝 Notifications to be inserted');
  
      try {
        await Notifications.bulkCreate(notifications);
        console.log('✅ Notifications inserted successfully.');
      } catch (error) {
        console.error('❌ Error inserting notifications:', error);
      }
  
      // Send notifications
      const notificationPromises = matchedCustomers.map(({ customerNumber, dayName }) =>
        sendNotification(customerNumber, dayName)
      );
  
      const notificationResults = await Promise.allSettled(notificationPromises);
  
      notificationResults.forEach((result, index) => {
        const customer = matchedCustomers[index];
        if (result.status === 'rejected') {
          console.error(`❌ Notification for user ${customer.customerNumber} failed:`, result.reason);
        } else {
          console.log(`📩 Notification for user ${customer.customerNumber} sent successfully.`);
        }
      });
    } else {
      console.log('ℹ️ No matched customers for today.');
    }
  };
  
  async function sendNotification(customerNumber: number, dayName: string) {
    try {
      const userTokens = await RetailerDevice.findAll({
        where: {
          customerNumber,
          deviceToken: {
            [Op.not]: '',
          },
        },
      });
  
      const validTokens = userTokens
        .map((device) => device.deviceToken)
        .filter((token) => token && token.trim() !== '');
  
      console.log(validTokens, ` Valid tokens for user ${customerNumber}`);
  
      if (validTokens.length > 0) {
        await sendMultiFCMNotification({
          tokens: validTokens,
          title: 'Order Day',
          body: `It's ${dayName}! Get ready for your weekly order delivery`,
        });
      } else {
        console.log(`⚠️ No valid tokens for user ${customerNumber}`);
      }
    } catch (error) {
      console.error(`❌ Error sending notification to user ${customerNumber}:`, error);
    }
  }