import { Response, NextFunction, Request } from "express";
import jwt from "jsonwebtoken";
import { AuthMessage } from "../constants";
import { sendResponse } from "../utils/sendResponse";
import { Token } from "../models/postgres/token.model";
import { DriverDevice } from "../models/postgres/driverDevice.model";

export interface AuthRequest extends Request {
  user?: any;
}

const verifyRole = (...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendResponse(res, 401, false, null, AuthMessage.TOKEN_MISSING);
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        role: string;
        deviceId: string;
      };
      console.log(decoded, 'decoded')

      if (!allowedRoles.includes(decoded.role)) {
        return sendResponse(res, 403, false, null, AuthMessage.UNAUTHORIZE);
      }

      if (decoded.role === 'retailer') {

        const tokenRecord = await Token.findOne({
          where: { token },
        });

        if (!tokenRecord) {
          return sendResponse(res, 403, false, null, AuthMessage.INVALID_TOKEN);
        }
      }

      if (decoded.role === 'driver') {

        const tokenRecord = await DriverDevice.findOne({
          where: { token: token },
        });

        if (!tokenRecord) {
          return sendResponse(res, 403, false, null, AuthMessage.INVALID_TOKEN);
        }
      }


      req.user = decoded;
      next();
    } catch (error) {
      return sendResponse(res, 401, false, null, AuthMessage.INVALID_TOKEN);
    }
  };
};

export default verifyRole;
