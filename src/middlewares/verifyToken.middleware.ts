// src/middlewares/verifyToken.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendResponse } from "../utils/sendResponse";
import { AuthMessage } from "../constants";

dotenv.config();

export interface AuthRequest extends Request {
  user?:any; 
}

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendResponse(res, 403, false, null, AuthMessage.TOKEN_MISSING);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    console.log(decoded,'decoded---->')
    req.user = decoded;
    next();
  } catch (error) {
    return sendResponse(res, 403, false, null, AuthMessage.INVALID_TOKEN);
  }
};

export default verifyToken;
