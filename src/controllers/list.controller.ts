import { Request, Response } from "express";
import { AuthService } from "../businesslogic/auth.service";
import { ListService } from "../businesslogic/list.service";
import { General } from "../constants";
import { sendResponse } from "../utils/sendResponse";


export class ListController {
    private listService: ListService;
  
    constructor() {
      this.listService = new ListService();
    }

    async getSalesCategoryList(req: Request, res: Response) {
        const data = await this.listService.getSalesCategoryList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getPriceClassList(req: Request, res: Response) {
        const data = await this.listService.getPriceClassList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getCustomerList(req: Request, res: Response) {
        const data = await this.listService.getCustomerList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getProductList(req: Request, res: Response) {
        const data = await this.listService.getProductList(req.query);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getUserList(req: Request, res: Response) {
        const data = await this.listService.getUserList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }   

    async getSalesRepList(req: Request, res: Response) {
        const data = await this.listService.getSalesRepList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getRegisterCustomerList(req: Request, res: Response) {
        const data = await this.listService.getRegisterCustomerList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getCustomerRouteList(req: Request, res: Response) {
        const data = await this.listService.getCustomerRouteList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getProductListBySearch(req: Request, res: Response) {
        const data = await this.listService.getProductListBySearch(req.query.search as string);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getListOfRoutes(req: Request, res: Response) {
        const data = await this.listService.getListOfRoutes();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getListOfCustomerForEmail(req: Request, res: Response) {
        const data = await this.listService.getListOfCustomerForEmail(req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getListForInventory(req: Request, res: Response) {
        const data = await this.listService.getListForInventory();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
    
    async getListOfCustomersCreate(req: Request, res: Response) {
        const data = await this.listService.getListOfCustomersCreate();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getListOfVendorsCreate(req: Request, res: Response) {
        const data = await this.listService.getListOfVendorsCreate();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getListOfPurchaseOrdersCreate(req: Request, res: Response) {
        const data = await this.listService.getListOfPurchaseOrdersCreate();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }


    async getListOfRoutesForDriver(req: Request, res: Response) {
        const data = await this.listService.getListOfRoutesForDriver();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
}