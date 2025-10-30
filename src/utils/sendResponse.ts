import { Response } from 'express';

export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  data: any = null,
  message: string = ''
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};
