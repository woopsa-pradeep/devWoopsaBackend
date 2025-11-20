import { Op } from "sequelize";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import moment from "moment";
import { OrderPick } from "../models/postgres/epickOrder.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { Customer } from "../models/mmsql/customer.model";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";

export class CheckerService {

  /**
   * Get completed orders for checker to verify
   * - Returns orders where OrderPick.status = 'completed'
   * - These are orders that have been picked and are ready for checking
   */
  async getOrder() {
    // Get completed orders from OrderPick (orders that have been picked and are ready for checking)
    const startDate = moment().subtract(1, 'day').startOf('day').toDate();
    const completedOrdersWhere: any = {
      status: 'completed', // Only get completed orders (already picked by epick)
    };
    
    // Apply start date filter
    if (startDate) {
      completedOrdersWhere.completedAt = { [Op.gte]: startDate };
    }
    
    const completedOrders = await OrderPick.findAll({
      where: completedOrdersWhere,
      attributes: ['orderNumber'],
      raw: true,
    });

    // Clean + dedupe array of order numbers
    const completedOrderNumbers = Array.from(
      new Set(
        completedOrders
        .map((o: any) => o?.orderNumber)
        .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '')
        .map((v: any) => String(v)) // normalize to string
      )
    );
    
    console.log(completedOrderNumbers, 'completedOrderNumbers for checker');
  
    // If no completed orders, return empty array
    if (completedOrderNumbers.length === 0) {
      return [];
    }

    // Query OrderHeader for completed orders
    const headerWhere: any = {
      // Exclude orders where Order_Updated = 1
      Order_Updated: { [Op.ne]: true },
      // Only get orders that are completed (already picked)
      Order_Number: { [Op.in]: completedOrderNumbers }
    };
    
    // Apply start date filter
    if (startDate) {
      headerWhere.Order_Date = { [Op.gte]: startDate };
    }
    
    console.log(headerWhere, 'headerWhere for checker');
    
    const completedOrdersList = await OrderHeader.findAll({
      where: headerWhere,
      attributes: ['Order_Number', 'Order_Date'],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Number', 'C_Name'],
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
              required: false,
            },
          ],
          required: false,
        },
        {
          model: OrderDetail,
          as: 'orderDetails',
          attributes: ['Order_Number', 'Line_Number', 'Quantity_Ordered', 'Pack', 'CaseCount'],
          required: false,
          include: [
            {
              model: Inventory,
              as: 'inventory',
              attributes: ['Item_Number', 'Description'],
              required: false,
            },
          ],
        },
      ],
      order: [
        ['Order_Number', 'ASC'],
        [{ model: OrderDetail, as: 'orderDetails' }, 'Line_Number', 'ASC'],
      ],
    });
  
    console.log(completedOrdersList, 'completedOrdersList for checker');
  
    return completedOrdersList;
  }
}
