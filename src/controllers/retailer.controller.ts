import { Response } from "express";
import { General, Manager } from "../constants";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { sendResponse } from "../utils/sendResponse";
import { RetailerService } from "../businesslogic/retailer.service";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { ICreateRetailerProductCatalog, IUpdateRetailerProductCatalog, IGetRetailerProductCatalogs, IGetStories } from "../interfaces/request.body.interface";

export class RetailerController {
  private retailerService: RetailerService;

  constructor() {
    this.retailerService = new RetailerService();
  }

  async getProfile(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getProfile(req.user.id);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async getNewItems(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getNewItems(req.user);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getInventoryItems(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getInventoryItems(req.body,req.user);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getTradeShowItems(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getTradeShowItems(req.body,req.user);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getInventoryShowPrepaidTax(req: AuthRequest, res: Response) {
  const data = await this.retailerService.getInventoryShowPrepaidTax(req.user);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getDeliveryCharge(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getDeliveryCharge(req.user.id);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getAllInventoryData(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getAllInventoryData();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async createInventoryLocation(req: AuthRequest, res: Response) {
    const body = { ...req.body, C_Number: req.user.id };
    const data = await this.retailerService.createInventoryLocation(body);
    sendResponse(res, 201, true, data, 'Inventory location created successfully');
  }

  async updateInventoryLocation(req: AuthRequest, res: Response) {
    const body = { ...req.body, C_Number: req.user.id };
    const id = Number(req.params.id);
    const data = await this.retailerService.updateInventoryLocation(id, body);
    sendResponse(res, 200, true, data, 'Inventory location updated successfully');
  }

  async getBannerData(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getBannerData();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getProductData(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getProductData(req.body.ids);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async getBannerList(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getBannerList();
    sendResponse(res, 200, true, data, Manager.BANNER_LIST_SUCCESFULLY);
  }
  // Cart CRUD Controller Methods
  async addToCart(req: AuthRequest, res: Response) {
    const cartData = {
      ...req.body,
      Customer_Number: req.user.id,
      Tax_Rate: req.body.Tax_Rate,
      Price_With_Tax: req.body.Price_With_Tax || 0,
      TotalprepaidTaxRate: req.body.TotalprepaidTaxRate || 0,
      prepaidTaxRate: req.body.prepaidTaxRate || 0,
    };
    const data = await this.retailerService.addToCart(cartData);
    sendResponse(res, 201, true, data, "Item added to cart successfully");
  }

  async addToTradeShowCart(req: AuthRequest, res: Response) {
    const cartData = {
      ...req.body,
      Customer_Number: req.user.id,
      Tax_Rate: req.body.Tax_Rate,
      Price_With_Tax: req.body.Price_With_Tax || 0,
      TotalprepaidTaxRate: req.body.TotalprepaidTaxRate || 0,
      prepaidTaxRate: req.body.prepaidTaxRate || 0,
    };
    const data = await this.retailerService.addToTradeShowCart(cartData);
    sendResponse(res, 201, true, data, "Item added to trade show cart successfully");
  }

  async getTradeShowCartItems(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.retailerService.getTradeShowCartItems(req.user.id, Number(id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateTradeShowCartItem(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.retailerService.updateTradeShowCartItem(Number(id), req.body);
    sendResponse(res, 200, true, data, "Trade show cart item updated successfully");
  }

  async getCartItems(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getCartItems(req.user.id);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateCartItem(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.retailerService.updateCartItem(Number(id), req.body);
    sendResponse(res, 200, true, data, "Cart item updated successfully");
  }

  async removeFromCart(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.retailerService.removeFromCart(Number(id));
    sendResponse(res, 200, true, data, data.message);
  }
  async removeFromTradeShowCart(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.retailerService.removeFromTradeShowCart(Number(id));
    sendResponse(res, 200, true, data, data.message);
  }

  async clearCart(req: AuthRequest, res: Response) {
    const data = await this.retailerService.clearCart(req.user.id);
    sendResponse(res, 200, true, data, data.message);
  }
  async clearTradeShowCart(req: AuthRequest, res: Response) {
    const data = await this.retailerService.clearTradeShowCart(req.user.id);
    sendResponse(res, 200, true, data, data.message);
  }

  async getCartItemById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.retailerService.getCartItemById(Number(id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  

  async getCartSummary(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getCartSummary(req.user.id);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async getWareHouseProfileDetails(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getWareHouseProfileDetails();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async placeOrder(req: AuthRequest, res: Response) {
    const data = await this.retailerService.placeOrder(req.body, req);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async placeTradeShowOrder(req: AuthRequest, res: Response) {
    const data = await this.retailerService.placeTradeShowOrder(req.body, req);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async getOrderHistoryByProductNumber(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getOrderHistoryByProductNumber(Number(req.params.id), req.user.id);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async getOrderHistory(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getOrderHistory(req.user.id, req.query as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async getOrderHistoryByOrderNumber(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getOrderHistoryByOrderNumber(Number(req.params.id), req.query as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
   async getAccountReceivablesList(req: AuthRequest, res: Response) {
  const data = await this.retailerService.getAccountReceivablesList(req.query as PaginationOptions, req);
  sendResponse(res, 200, true, data, Manager.FETCH_AR_LIST_SUCCESS);
}

  async getOrderedProducts(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getOrderedProducts(req.user.id, req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getOrderDeliveryStatus(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getOrderDeliveryStatus(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async scanItemByBarcode(req: AuthRequest, res: Response) {
    const data = await this.retailerService.scanItemByBarcode(req.params.id,req.user.id);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async addMultipleItems(req: AuthRequest, res: Response) {
  try {
    const data = await this.retailerService.addMultipleItems(req.user.id, req.body);
    sendResponse(res, 200, true, data, "Items added successfully");
  } catch (error: any) {
    sendResponse(res, 500, false, null, error.message || "Something went wrong");
  }
}

  async addToCartByScanner(req: AuthRequest, res: Response) {
    const data = await this.retailerService.addToCartByScanner(req.params.id, req.user.id);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  
  async addToCartMultiScanner(req: AuthRequest, res: Response) {
    const data = await this.retailerService.addToCartMultiScanner(req.body, req.user.id);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  // notification
  async getNotificationList(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getNotificationList(req.user.id.toString());
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async readAllNotification(req: AuthRequest, res: Response) {
    const data = await this.retailerService.readAllNotification(req.user.id.toString());
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async readNotification(req: AuthRequest, res: Response) {
    const data = await this.retailerService.readNotification(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async deleteNotification(req: AuthRequest, res: Response) {
    const data = await this.retailerService.deleteNotification(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async deleteAllNotification(req: AuthRequest, res: Response) {
    const data = await this.retailerService.deleteAllNotification(req.user.id.toString());
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async putFcmToken(req: AuthRequest, res: Response) {
    const data = await this.retailerService.putFcmToken(Number(req.user.deviceId), req.body.fcmToken);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async createSupportTicket(req: AuthRequest, res: Response) {
    const data = await this.retailerService.createSupportTicket(req.body, req.user.id,req.file);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getSupportTicket(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getSupportTicket(req.user.id, req.query as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getPdfOfOrderDetails(req: AuthRequest, res: Response) {
    try {
      const { orderNumber, hasPrice, orientation,invoiceGenerated } = req.query;
      
      if (!orderNumber) {
        return sendResponse(res, 400, false, null, "Order number is required");
      }

      const result = await this.retailerService.getPdfOfOrderDetails({
        orderNumber: Number(orderNumber),
        invoiceGenerated: invoiceGenerated === 'true' ? true : false,
        hasPrice: hasPrice === 'true',
        orientation: (orientation as 'portrait' | 'landscape') || 'landscape'
      }, req.user.id);

      // Always return JSON response with the data
      sendResponse(res, 200, true, result.data, "Order details retrieved successfully");
    } catch (error: any) {
      sendResponse(res, 500, false, null, error.message || "Error retrieving order details");
    }
  }

  // RetailerProductCatalog CRUD controller methods
  async createRetailerProductCatalog(req: AuthRequest, res: Response) {
    const data = await this.retailerService.createRetailerProductCatalog(req.body as ICreateRetailerProductCatalog, req);
    sendResponse(res, 201, true, data, Manager.RETAILER_PRODUCT_CATALOG_CREATED_SUCCESSFULLY);
  }

  async getRetailerProductCatalogById(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getRetailerProductCatalogById(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.RETAILER_PRODUCT_CATALOG_FETCHED_SUCCESSFULLY);
  }

  async getAllRetailerProductCatalogs(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getAllRetailerProductCatalogs(req.query as PaginationOptions & IGetRetailerProductCatalogs);
    sendResponse(res, 200, true, data, Manager.RETAILER_PRODUCT_CATALOG_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateRetailerProductCatalog(req: AuthRequest, res: Response) {
    const data = await this.retailerService.updateRetailerProductCatalog(Number(req.params.id), req.body as IUpdateRetailerProductCatalog, req);
    sendResponse(res, 200, true, data, Manager.RETAILER_PRODUCT_CATALOG_UPDATED_SUCCESSFULLY);
  }

  async deleteRetailerProductCatalog(req: AuthRequest, res: Response) {
    const data = await this.retailerService.deleteRetailerProductCatalog(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.RETAILER_PRODUCT_CATALOG_DELETED_SUCCESSFULLY);
  }

  async toggleRetailerProductCatalogStatus(req: AuthRequest, res: Response) {
    const data = await this.retailerService.toggleRetailerProductCatalogStatus(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.RETAILER_PRODUCT_CATALOG_STATUS_TOGGLED_SUCCESSFULLY);
  }

  async getLinks(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getLinks();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }



  // story
  async getAllStory(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getAllStory(req.query as PaginationOptions & IGetStories, req);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async viewStory(req: AuthRequest, res: Response) {
    const data = await this.retailerService.viewStory(Number(req.params.id), req);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async removeMultipleItemsFromCart(req: AuthRequest, res: Response) {
    const data = await this.retailerService.removeMultipleItemsFromCart(req.body.cartItemIds);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getPolicies(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getPolicies();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getDistributorContactDetails(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getDistributorContactDetails(req.user.id);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async hasmultipleStore(req: AuthRequest, res: Response) {
    const data = await this.retailerService.hasmultipleStore(req.query.email as string);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async switchStore(req: AuthRequest, res: Response) {
    const data = await this.retailerService.switchStore(Number(req.params.storeId), req);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getSalesCategoryPriceClassByCustomer(req: AuthRequest, res: Response) {
    const customerNumber = req.params.customerNumber ;
    const data = await this.retailerService.getSalesCategoryPriceClassByCustomer(Number(customerNumber));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getSalesCategoryByCustomer(req: AuthRequest, res: Response) {
    const customerNumber = req.params.customerNumber ;
    const data = await this.retailerService.getSalesCategoryByCustomer(Number(customerNumber));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateRetailerDocuments(req: AuthRequest, res: Response) {
    const data = await this.retailerService.updateRetailerDocuments(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async deleteRetailerDocuments(req: AuthRequest, res: Response) {
    const data = await this.retailerService.deleteRetailerDocuments(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async createRetailerDocuments(req: AuthRequest, res: Response) {
    const data = await this.retailerService.createRetailerDocuments(req.body);
    sendResponse(res, 201, true, data, General.SUCCESS);
  } 

  async getTradeShow(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getTradeShow();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async uploadImages(req: AuthRequest, res: Response) {
    const data = await this.retailerService.uploadImages(req);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async getRetailerSuggestedItems(req: AuthRequest, res: Response) {
    const data = await this.retailerService.getRetailerSuggestedItems(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getRetailerSuggestedItemsByCustomer(req: AuthRequest, res: Response) {
    const { customerNumber } = req.body;
    const data = await this.retailerService.getRetailerSuggestedItemsByCustomer(customerNumber);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async getCustomerLastBalance(req: AuthRequest, res: Response) {
    const { customerNumber } = req.params;
    const data = await this.retailerService.getCustomerLastBalance(Number(customerNumber));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
}
