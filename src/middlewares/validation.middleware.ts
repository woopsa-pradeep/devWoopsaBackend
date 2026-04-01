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

export const validateParams = (schema: AnySchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const value = await schema.validateAsync(req.params, {
                abortEarly: false,
                stripUnknown: true,
            });
            (req as any).params = value;
            next();
        } catch (error: any) {
            const errors = error.details.map((detail: any) => ({
                message: detail.message.replace(/"/g, ''),
            }));
            logger.error('Validation Error (params)', {
                error: error.message,
                validationErrors: errors,
                requestParams: req.params,
                endpoint: req.originalUrl,
                method: req.method,
            });
            res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: errors,
            });
        }
    };
};

export const validateQuery = (schema: AnySchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const value = await schema.validateAsync(req.query, {
                abortEarly: false,
                stripUnknown: true,
            });
            (req as any).query = value;
            next();
        } catch (error: any) {
            const errors = error.details.map((detail: any) => ({
                message: detail.message.replace(/"/g, ''),
            }));
            logger.error('Validation Error (query)', {
                error: error.message,
                validationErrors: errors,
                requestQuery: req.query,
                endpoint: req.originalUrl,
                method: req.method,
            });
            res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: errors,
            });
        }
    };
};