


import { Op } from "sequelize";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { Customer } from "../models/mmsql/customer.model";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { dayFunctionObject } from "../utils/helper";
import { AppError } from "../utils/AppError";
import { Driver } from "../models/postgres/driver.model";
import { DriverRouteAssignment } from "../models/postgres/driverRouteAssignment.model";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { DriverPickupOrder } from "../models/postgres/driverPickerOrder.model";
import { DriverOrders } from "../models/postgres/driverOrders.model";

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



async getDriverOrder(query:any,id:number){


    let {page,limit} = query;
    page = page ? Number(page) : 1;
    limit = limit ? Number(limit) : 10;
    const offset = (page - 1) * limit;

    console.log(id,'iddd');
   let driverRouteAssignment :any= await DriverRouteAssignment.findOne({
    where: {
        driverId: id,
    },
    attributes: ['routes'],
   });

   driverRouteAssignment = driverRouteAssignment?.dataValues ?? null;
   
   if (!driverRouteAssignment) throw new AppError("Driver not found", 404);
   const {rows: orders, count: total} = await OrderHeader.findAndCountAll({
    where: {
        Delivery_ID: { [Op.not]: 99 },
        Invoice_Number: { [Op.gt]: 0 },
        Route_Number:{[Op.in]: driverRouteAssignment.routes},
    },
    attributes: ['Order_Number', 'Order_Date', 'Invoice_Number', 'Delivery_ID','Route_Number'],
    include: [
        {
            model: Customer,
            as: 'customer',
            attributes: ['C_Number','C_CoName','C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip','C_Phone','C_PhoneMobile'],
        }
    ],
    order: [['Order_Number', 'DESC']],
    limit,
    offset,
   })
   
   return {orders, total}



}


async startOrder(orderNumber:number){


    let orderValue :any= await OrderHeader.findOne({
        where: {
            Order_Number: orderNumber,
        }
    })
    if (!orderValue) throw new AppError("Order not found", 404);
    orderValue = orderValue?.dataValues ?? null;
    

    let orderBarcode = await OrderPickBox.findAll({
        where: {
            orderNumber: orderNumber,
        }
    })

    let barCode :any =[]

    if(orderBarcode.length > 0){
        for(const barcode of orderBarcode){
            barCode.push(barcode.barcode)
        }
    }else {
        const barCodeInOrderConfirmation = await DriverPickupOrder.findOne({
            where: {
                order_number: orderNumber,
            }
        })
        if(barCodeInOrderConfirmation){
            barCode = barCodeInOrderConfirmation.barcodes
        }
    }

    let acceptOrderBody:any ={
        orderNumber: orderNumber,
        status: "inProgress",
        startTime: new Date(),
        endTime: null,
        estimateTime: null,
        images: [],
        note: "",
        totalScanBundle: 0,
        totalBundle: orderValue.Bundles,
        damageBundle:0,
        barCode:barCode || [],
        paymentMethod:'',
        amount:0,
        checkImage:[],
        checkNumber:0,
        completeScan:false,
        completePayment:false,
        completeDeliverRequirement:false,
        customerSignature:'',
        signedBy:''
    }
    
    await DriverOrders.create(acceptOrderBody)
    
}

 

}