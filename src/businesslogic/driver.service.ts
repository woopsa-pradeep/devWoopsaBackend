


import { Op } from "sequelize";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { Customer } from "../models/mmsql/customer.model";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { dayFunctionObject } from "../utils/helper";
import { AppError } from "../utils/AppError";
import { Driver } from "../models/postgres/driver.model";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { DriverPickupOrder } from "../models/postgres/driverPickerOrder.model";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { IUploadProductImage } from "../interfaces/request.body.interface";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { uploadFileToAzure } from "../utils/azureUploader";
import { AuthMessage } from "../constants";

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
 