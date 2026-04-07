import { Response } from 'express';
import { LiteDriverService } from '../businesslogic/liteDriver.service';
import { sendResponse } from '../utils/sendResponse';
import { General } from '../constants';
import { AuthRequest } from '../middlewares/verifyToken.middleware';

export class LiteDriverController {
  private liteDriverService: LiteDriverService;

  constructor() {
    this.liteDriverService = new LiteDriverService();
  }

  async getCustomerForLatLong(req: AuthRequest, res: Response) {
    const { search } = req.query as { search: string };
    const data = await this.liteDriverService.getCustomerForLatLong(search);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerByCNumber(req: AuthRequest, res: Response) {
    const { search } = req.query as { search: string };
    const data = await this.liteDriverService.getCustomerByCNumber(search);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async setCustomerLatLong(req: AuthRequest, res: Response) {
    const driverId = Number(req.user?.id);
    const data = await this.liteDriverService.setCustomerLatLong(driverId, req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
}
