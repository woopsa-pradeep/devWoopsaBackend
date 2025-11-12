import { Request, Response } from "express";
import { CheckerService } from "../businesslogic/checker.service";
import { General } from "../constants";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "../middlewares/verifyToken.middleware";

export class CheckerController {

    private checkerService: CheckerService;

    constructor() {
        this.checkerService = new CheckerService();
    }

    async loginChecker(req: Request, res: Response) {
    const data = await this.checkerService.loginChecker(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
    }
 
}