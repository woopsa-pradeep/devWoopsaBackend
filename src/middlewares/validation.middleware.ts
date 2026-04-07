import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'joi';
import logger from '../utils/logger';

export const validateRequest = (schema: AnySchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const value = await schema.validateAsync(req.body, {
                abortEarly: false,
                stripUnknown: true
            });
            req.body = value;
            next();
        } catch (error: any) {
            const errors = error.details.map((detail: any) => ({
                message: detail.message.replace(/"/g, "") 
            }));
            
            logger.error('Validation Error', {
                error: error.message,
                validationErrors: errors,
                requestBody: req.body,
                endpoint: req.originalUrl,
                method: req.method
            });
            
            res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: errors
            });
        }
    };
};

export const validateQuery = (schema: AnySchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const value = await schema.validateAsync(req.query, {
                abortEarly: false,
                stripUnknown: true
            });
            (req as Request & { query: unknown }).query = value as any;
            next();
        } catch (error: any) {
            const errors = error.details.map((detail: any) => ({
                message: detail.message.replace(/"/g, "")
            }));

            logger.error('Validation Error (query)', {
                error: error.message,
                validationErrors: errors,
                requestQuery: req.query,
                endpoint: req.originalUrl,
                method: req.method
            });

            res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: errors
            });
        }
    };
};