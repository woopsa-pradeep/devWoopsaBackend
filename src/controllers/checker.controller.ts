import { Request, Response } from "express";
import { CheckerService } from "../businesslogic/checker.service";
import { General } from "../constants";
import { sendResponse } from "../utils/sendResponse";

export class CheckerController {

    private checkerService: CheckerService;

    constructor() {
        this.checkerService = new CheckerService();
    }

    async getOrder(req: Request, res: Response) {
        const data = await this.checkerService.getOrder();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
}