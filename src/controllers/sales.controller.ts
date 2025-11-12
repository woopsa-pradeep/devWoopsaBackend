import { SalesService } from "../businesslogic/sales.service";
import { Response } from "express";
import { General, SalesMessage } from "../constants";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { sendResponse } from "../utils/sendResponse";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { AppError } from "../utils/AppError";
import { Inventory } from "../models/mmsql/inventory.model";
import SalesCategory from "../models/mmsql/salesCategory.model";
import { PriceClass } from "../models/mmsql/priceClass.model";
import InventoryStatus from "../models/mmsql/inventoryStatus.model";
import { ProductImage } from "../models/postgres/product.model";
import { getDiscount, getFirstValidPrice, getInventoryOnHand, getTaxRateV1 } from "../utils/helper";
import Setting from "../models/postgres/setting.model";
import CustomerCart from "../models/postgres/retailerCart.model";




export class SalesController {
    private salesService: SalesService;
    constructor() {
        this.salesService = new SalesService();
    }

    async getProfile(req: AuthRequest, res: Response) {
        const data = await this.salesService.getProfile(req.user.id);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrderHistory(req: AuthRequest, res: Response) {
        const data = await this.salesService.getOrderHistory(Number(req.params.customerId), req.query as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
    async getOrderHistoryByOrderNumber(req: AuthRequest, res: Response) {
        const data = await this.salesService.getOrderHistoryByOrderNumber(Number(req.params.orderNumber), req.query as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getCustomerHistory(req: AuthRequest, res: Response) {
        const data = await this.salesService.getOrderHistoryByOrderNumber(Number(req.params.userId), req.query as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async placeOrder(req: AuthRequest, res: Response) {
        const data = await this.salesService.placeOrder(req.body, req, req.params.customerId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }


    async getReturnCartItems(req: AuthRequest, res: Response) {
        const data = await this.salesService.getReturnCartItems(Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async returnPlaceOrder(req: AuthRequest, res: Response) {
        const data = await this.salesService.returnPlaceOrder(req.body, req, req.params.customerId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getInventoryItems(req: AuthRequest, res: Response) {
        const data = await this.salesService.getInventoryItems(req.body as PaginationOptions & { search?: string, masterSearch?: string }, Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getInventoryItemsBySalesMan(req: AuthRequest, res: Response) {
        const data = await this.salesService.getInventoryItemsBySalesMan(req.body as PaginationOptions & { search?: string, masterSearch?: string }, Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async changePassword(req: AuthRequest, res: Response) {
        const data = await this.salesService.changePassword(req.body, req.user.id);
        sendResponse(res, 200, true, data, SalesMessage.PASSWORD_CHANGED);
    }

    async getCustomerList(req: AuthRequest, res: Response) {
        const data = await this.salesService.getCustomerList(Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async setSalesSession(req: AuthRequest, res: Response) {
        const data = await this.salesService.setSalesSession(Number(req.user.id), Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getCartItemById(req: AuthRequest, res: Response) {
        const data = await this.salesService.getCartItemById(Number(req.params.cartItemId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getCartItem(req: AuthRequest, res: Response) {
        const data = await this.salesService.getCartItems(Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async clearCart(req: AuthRequest, res: Response) {
        const data = await this.salesService.clearCart(Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
    async updateCartItem(req: AuthRequest, res: Response) {
        const data = await this.salesService.updateCartItem(Number(req.params.cartItemId), req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
    async removeFromCart(req: AuthRequest, res: Response) {
        const data = await this.salesService.removeFromCart(Number(req.params.cartItemId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
    async addToCart(req: AuthRequest, res: Response) {
        const cartData = {
            ...req.body,
            Customer_Number: req.params.customerId,
            Tax_Rate: req.body.Tax_Rate,
            Price_With_Tax: req.body.Price_With_Tax,
            placedBySalesPerson: true,
            salesPersonNumber: Number(req.user.id),
            originalPrice: req.body.originalPrice || 0,
            discount: req.body.discount || 0
        };
        const data = await this.salesService.addToCart(cartData, Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    
    async addToReturnCart(req: AuthRequest, res: Response) {

        const cartData = {
            ...req.body,
            Customer_Number: req.params.customerId,
            Tax_Rate: req.body.Tax_Rate,
            Price_With_Tax: req.body.Price_With_Tax,
            placedBySalesPerson: true,
            salesPersonNumber: Number(req.user.id),
            originalPrice: req.body.originalPrice || 0,
            discount: req.body.discount || 0
        };
        const data = await this.salesService.addToReturnCart(cartData, Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrderHistoryByProductNumber(req: AuthRequest, res: Response) {
        const { productNumber, customerId } = req.query;
        const data = await this.salesService.getOrderHistoryByProductNumber(Number(productNumber), Number(customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getCustomerListAsPerSalesRep(req: AuthRequest, res: Response) {
        const data = await this.salesService.getCustomerListAsPerSalesRep(Number(req.user.id), req.body as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getCustomerOrderedProducts(req: AuthRequest, res: Response) {
        const data = await this.salesService.getCustomerOrderedProducts(Number(req.params.customerId), req.query as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrderDeliveryStatus(req: AuthRequest, res: Response) {
        const data = await this.salesService.getOrderDeliveryStatus(Number(req.params.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getDeliveryCharge(req: AuthRequest, res: Response) {
        const data = await this.salesService.getDeliveryCharge(Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getBannerList(req: AuthRequest, res: Response) {
        const data = await this.salesService.getBannerList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getAccountReceivablesList(req: AuthRequest, res: Response) {
        const data = await this.salesService.getAccountReceivablesList(req.query as PaginationOptions, Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async addToCartByScanner(req: AuthRequest, res: Response) {
        const upcNumber = typeof req.query.upcNumber === 'string' ? req.query.upcNumber : undefined;
        if (!upcNumber) throw new AppError('upcNumber is required', 400);
        const data = await this.salesService.addToCartByScanner(upcNumber, Number(req.params.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async scanItemByBarcode(req: AuthRequest, res: Response) {
        const upcNumber = typeof req.query.upcNumber === 'string' ? req.query.upcNumber : undefined;
        if (!upcNumber) throw new AppError('upcNumber is required', 400);
        const data = await this.salesService.scanItemByBarcode(upcNumber, Number(req.params.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async addMultipleItems(req: AuthRequest, res: Response) {
      try {
        const data = await this.salesService.addMultipleItems(Number(req.params.customerId), req.body);
        sendResponse(res, 200, true, data, "Items added successfully");
      } catch (error: any) {
        sendResponse(res, 500, false, null, error.message || "Something went wrong");
      }
    }
 
    async addToCartMultiScanner(req: AuthRequest, res: Response) {
        const data = await this.salesService.addToCartMultiScanner(req.body, Number(req.params.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
    async getCustomerByIdInfoInCalender(req: AuthRequest, res: Response) {
        const data = await this.salesService.getCustomerByIdInfoInCalender(Number(req.params.customerId),Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }


    async getCustomerCalenderList(req: AuthRequest, res: Response) {
        const data = await this.salesService.getCustomerCalenderList(Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);

    }

    async getCustomerOrderByCalenderDate(req: AuthRequest, res: Response) {
        const data = await this.salesService.getCustomerOrderByCalenderDate(req.query as PaginationOptions, Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getCustomerOrderOfCurrentWeek(req: AuthRequest, res: Response) {
        const data = await this.salesService.getCustomerOrderOfCurrentWeek(req.query as PaginationOptions, Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getWareHouseProfileDetails(req: AuthRequest, res: Response) {
        const data = await this.salesService.getWareHouseProfileDetails();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getPdfOfOrderDetails(req: AuthRequest, res: Response) {
        const { orderNumber, hasPrice, orientation } = req.query;
        if (!orderNumber) {
            return sendResponse(res, 400, false, null, "Order number is required");
        }
         const result = await this.salesService.getPdfOfOrderDetails({
            orderNumber: Number(orderNumber),
            hasPrice: hasPrice === 'true',
            orientation: (orientation as 'portrait' | 'landscape') || 'landscape'
        }, Number(req.params.customerId));
        sendResponse(res, 200, true, result.data, General.SUCCESS);
    }

    async removeMultipleItemsFromCart(req: AuthRequest, res: Response) {
        const data = await this.salesService.removeMultipleItemsFromCart(req.body.cartItemIds);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getPolicies(req: AuthRequest, res: Response) {
        const data = await this.salesService.getPolicies();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    // SalesCallTime methods
    async createSalesCallTime(req: AuthRequest, res: Response) {
        const data = await this.salesService.createSalesCallTime(req.body,req.user.id);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async updateSalesCallTime(req: AuthRequest, res: Response) {
        const data = await this.salesService.updateSalesCallTime(Number(req.params.id), req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    // SalesNote CRUD methods
    async createSalesNote(req: AuthRequest, res: Response) {
        const noteData = {
            CustomerNumber: req.body.CustomerNumber,
            note: req.body.note,
            salesId: Number(req.user.id)
        };
        const data = await this.salesService.createSalesNote(noteData);
        sendResponse(res, 201, true, data, "Sales note created successfully");
    }

    async getAllSalesNotes(req: AuthRequest, res: Response) {
        const data = await this.salesService.getAllSalesNotes(
            Number(req.params.customerId), 
            req.query as PaginationOptions & { search?: string }
        );
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getSalesNoteById(req: AuthRequest, res: Response) {
        const data = await this.salesService.getSalesNoteById(Number(req.params.salesId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async updateSalesNote(req: AuthRequest, res: Response) {
        const data = await this.salesService.updateSalesNote(
            Number(req.params.id),
            req.body
        );
        sendResponse(res, 200, true, data, "Sales note updated successfully");
    }

    async deleteSalesNote(req: AuthRequest, res: Response) {
        const data = await this.salesService.deleteSalesNote(Number(req.params.salesId));
        sendResponse(res, 200, true, data, data.message);
    }

    async getSalesNotesByCustomer(req: AuthRequest, res: Response) {
        const data = await this.salesService.getSalesNotesByCustomer(Number(req.params.customerId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

 

}