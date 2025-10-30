import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import SalesSession from "../models/postgres/salesSession.model";
import { AuthRequest } from "./verifyToken.middleware";

export const verifySalesSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerNumber = req.headers['customer'] as string;
    
    if (!customerNumber) {
      throw new AppError("Customer number is required in header", 400);
    }

    const userId = req.user?.id;

    
    if (!userId) {
      throw new AppError("User ID not found", 400);
    }

    // Find the sales session for this user
    const salesSession = await SalesSession.findOne({
      where: { 
        userId: userId,
        currentCustomerId: parseInt(customerNumber)
      }
    });

    if (!salesSession) {
      const currentSession = await SalesSession.findOne({
        where: { 
          userId: userId,
        }
      });
      return res.status(409).json({
        success: false,
        message: "Customer context changed. Please refresh",
        data:currentSession
      });

    }

    // If session exists and matches the customer, proceed
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
