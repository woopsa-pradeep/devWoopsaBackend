import { NextFunction, Response } from "express"
import { OrderPick } from "../models/postgres/epickOrder.model"
import { AuthRequest } from "./verifyToken.middleware"
import { sendResponse } from "../utils/sendResponse"
import { Op } from "sequelize"


export const hasExistingOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const order = await OrderPick.findOne({
        where: {
            pickerUserNumber: req.user.id,
            status: 'in_progress'
        }
    })
    if(order){
        return sendResponse(res, 400, false, null, 'You already have an existing order in progress')
    }
    next()
}

export const hasOrderTakenByOtherPicker = async (req: AuthRequest, res: Response, next: NextFunction) => {

    let orderNumber = req.params.orderNumber
    if(req.body.orderNumber){
        orderNumber = req.body.orderNumber
    }
    const clash = await OrderPick.findOne({
        attributes: ['id', 'orderNumber', 'pickerUserNumber', 'status'],
        where: {
          orderNumber: orderNumber,
          status: 'in_progress',
          pickerUserNumber: { [Op.ne]: req.user.id },
        },
      });
    if(clash){
        return sendResponse(res, 400, false, null, 'This order is already taken by another picker')
    }
    next()
}