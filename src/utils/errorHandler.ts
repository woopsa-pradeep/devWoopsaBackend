import { AppError } from './AppError';

export const setupErrorHandlers = (app: any) => {
    // Handle 404 errors
    app.use((req: any, res: any, next: any) => {
        const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
        next(error);
    });
}; 