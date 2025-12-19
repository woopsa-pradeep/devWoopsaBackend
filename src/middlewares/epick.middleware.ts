import { NextFunction, Response } from "express"
import { OrderPick } from "../models/postgres/epickOrder.model"
import { EpickConfirmation } from "../models/postgres/epickConfirmation.model"
import { EpickUser } from "../models/postgres/epickUser.model"
import { RecordLock } from "../models/mmsql/recordLocks.model"
import { AuthRequest } from "./verifyToken.middleware"
import { sendResponse } from "../utils/sendResponse"
import { Op } from "sequelize"


export const hasExistingOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check if user has an existing in_progress confirmation
    const confirmation = await EpickConfirmation.findOne({
        where: {
            pickerUserId: req.user.id,
            status: 'in_progress'
        }
    })
    if(confirmation){
        return sendResponse(res, 400, false, null, 'You already have an existing order in progress')
    }
    next()
}

export const hasOrderTakenByOtherPicker = async (req: AuthRequest, res: Response, next: NextFunction) => {

    let orderNumber = req.params.orderNumber
    if(req.body.orderNumber){
        orderNumber = req.body.orderNumber
    }
    
    // Get user's categories
    const user = await EpickUser.findOne({
        where: {
            id: req.user.id
        },
        attributes: ['category']
    });

    const userCategories = user?.category || [];

    // Get all epick_confirmation records for this order (both in_progress and completed)
    const allConfirmations = await EpickConfirmation.findAll({
        where: {
            orderNumber: orderNumber
        }
    });

    // Separate confirmations by status
    const inProgressConfirmations = allConfirmations.filter(conf => conf.status === 'in_progress');
    const completedConfirmations = allConfirmations.filter(conf => conf.status === 'completed');

    // Check if user's categories are already completed for this order
    if (userCategories.length > 0 && completedConfirmations.length > 0) {
        // Get all completed categories for this order
        const completedCategories = new Set<number>();
        completedConfirmations.forEach((conf: any) => {
            const cats = conf.category || [];
            cats.forEach((cat: number) => completedCategories.add(cat));
        });

        // Check if any of user's categories are already completed
        const userCategoriesCompleted = userCategories.some((userCat: number) => 
            completedCategories.has(userCat)
        );

        if (userCategoriesCompleted) {
            return sendResponse(res, 400, false, null, 'This order is already completed for your assigned categories')
        }
    }
    
    // Check if order is locked in RecordLock but NOT in epick_confirmation at all (ERP lock only)
    const recordLock = await RecordLock.findOne({
        where: {
            Lock_Number: orderNumber,
            Lock_Type: 0
        }
    });
    
    // If locked in RecordLock but NOT in epick_confirmation at all (no in_progress AND no completed), it's ERP lock only - block it
    // If order has ANY confirmation (in_progress or completed), it means a picker has worked on it via our system
    if(recordLock && allConfirmations.length === 0){
        return sendResponse(res, 400, false, null, 'Order is locked by ERP system')
    }
    
    next()
}