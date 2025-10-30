import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Create a timestamp for the filename
const getCurrentDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Function to get file and line information from error stack
const getErrorLocation = (error: Error) => {
    if (!error.stack) return { file: 'unknown', line: 'unknown' };
    
    const stackLines = error.stack.split('\n');
    // Skip the first line (error message) and find the first line with a file path
    for (let i = 1; i < stackLines.length; i++) {
        const line = stackLines[i].trim();
        const match = line.match(/at\s+.*\s+\((.*):(\d+):(\d+)\)/);
        if (match) {
            const filePath = match[1];
            const lineNumber = match[2];
            const fileName = path.basename(filePath);
            return { file: fileName, line: lineNumber };
        }
    }
    return { file: 'unknown', line: 'unknown' };
};

// Configure the logger
const logger = winston.createLogger({
    level: 'error', // Log only errors
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // Write all logs to a file with the current date
        new winston.transports.File({
            filename: path.join(logDir, `error-${getCurrentDate()}.log`),
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

// Create a wrapper function to include file and line information
const errorLogger = {
    error: (message: string, error?: Error | any) => {
        if (error instanceof Error) {
            const location = getErrorLocation(error);
            logger.error(message, {
                error: error.message,
                stack: error.stack,
                file: location.file,
                line: location.line
            });
        } else {
            logger.error(message, error);
        }
    },
    info: (message: string, meta?: any) => {
        logger.info(message, meta);
    }
};

export default errorLogger; 