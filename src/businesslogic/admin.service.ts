import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { Op } from "sequelize";

export class AdminService {
  async getOrdersBySource(startDate: string, endDate: string) {
    // Build where condition
    const whereCondition: any = {
      Order_Source: {
        [Op.in]: [13, 12]
      }
    };

    // Add date range filter if both dates are provided
    if (startDate && endDate) {
      whereCondition.Order_Date = { 
        [Op.between]: [startDate, endDate]
      };
    }

    // Fetch orders matching the criteria
    const orders = await OrderHeader.findAll({
      where: whereCondition,
      attributes: [
        'Order_Number',
        'Order_Date',
        'Order_Source',
        'C_Number',
        'Invoice_Number',
        'Invoice_Total',
        'Order_Type',
        'Confirmed'
      ],
      order: [['Order_Date', 'DESC'], ['Order_Number', 'DESC']]
    });

    return {
      success: true,
      count: orders.length,
      data: orders
    };
  }
}
