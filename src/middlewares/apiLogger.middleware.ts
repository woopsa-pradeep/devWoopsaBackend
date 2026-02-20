import { Request, Response, NextFunction } from 'express';
import ApiLog from '../models/postgres/apilogs.model';

export const apiLoggerMiddleware = (req: Request,res: Response,next: NextFunction) => {
  const start = Date.now();

  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - start;

      await ApiLog.create({
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        // userId: (req as any)?.user?.id || (req as any)?.customer?.C_Number || null, // if using auth
      });
    } catch (error) {
      console.error('API Log Error:', error);
    }
  });

  next();
};
