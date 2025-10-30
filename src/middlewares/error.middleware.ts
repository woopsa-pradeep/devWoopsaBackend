import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', error);
    // Give the logger time to write the error before exiting
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    if (reason instanceof Error) {
        logger.error('Unhandled Rejection', reason);
    } else {
        logger.error('Unhandled Rejection', new Error(String(reason)));
    }
});

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log(err,'tje erro')
    // Log the error first
    logger.error('Error occurred:', err);

    // Default error response
    let statusCode = 500;
    let status = 'error';
    let message = 'Something went wrong!';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        status = err.status;
        message = err.message;
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        status = 'fail';
        message = err.message;
    } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 400;
        status = 'fail';
        message = err.message;
    }

    // Send the response
    res.status(statusCode).json({
        success: false,
        status,
        message,
        timestamp: new Date().toISOString()
    });
}; 