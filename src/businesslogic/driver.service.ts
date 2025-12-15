import { Op } from "sequelize";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { Customer } from "../models/mmsql/customer.model";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";

export class DriverService {

async getDriverOrderList(){
    const orders = await OrderHeader.findAll({
        where: {
            Driver_ID: { [Op.not]: 99 },
            Invoice_Number: { [Op.gt]: 0 },
        },
        attributes: ['Order_Number', 'Order_Date', 'Invoice_Number', 'Driver_ID'],
        include: [
            {
                model: Customer,
                as: 'customer',
                attributes: ['C_Number', 'C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip','C_Phone'],
                include: [
                    {
                        model: CustomerRoute,
                        as: 'Routes',
                        attributes: ['Route_Number', 'Stop_Number'],
                    }
                ]
            }
        ],
        order: [['Order_Number', 'DESC']],
    })
    return orders
}


 

}