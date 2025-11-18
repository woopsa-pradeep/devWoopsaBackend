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
    
    // Check if order is already in progress or completed
    const existingOrder = await OrderPick.findOne({
        attributes: ['id', 'orderNumber', 'pickerUserNumber', 'status'],
        where: {
          orderNumber: orderNumber,
          status: { [Op.in]: ['in_progress', 'completed'] },
        },
      });
    
    if(existingOrder){
        if(existingOrder.status === 'completed'){
            return sendResponse(res, 400, false, null, 'This order is already completed')
        }
        if(existingOrder.pickerUserNumber !== req.user.id){
            return sendResponse(res, 400, false, null, 'This order is already taken by another picker')
        }
    }
    next()
}