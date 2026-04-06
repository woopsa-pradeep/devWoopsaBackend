import { Response } from "express";
import { ManagerService } from "../businesslogic/manager.service";
import { General, Manager } from "../constants";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { sendResponse } from "../utils/sendResponse";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { IGetProductInformation, ICreateLink, ICreateNotificationScheduler, ICreateStory, IUpdateLink, IUpdateNotificationScheduler, IUpdateStory, IGetNotificationSchedulers, IGetStories, ICreateRetailerProductCatalog, IGetRetailerProductCatalogs, IUpdateRetailerProductCatalog, ICreateWebView, IUpdateWebView, IGetWebViews, IWebViewGroupedResponse, IManualItemsSetting, IPopularItemsModeSetting } from "../interfaces/request.body.interface";
import { uploadFileToAzure } from "../utils/azureUploader";
import { parseReportFilters } from "../utils/parseReportFilters";
import { number } from "joi";
import { AppError } from "../utils/AppError";
import { send } from "process";


export class ManagerController {
  private managerService: ManagerService;

  constructor() {
    this.managerService = new ManagerService();
  }
  async getProfile(req: AuthRequest, res: Response) {
    const data = await this.managerService.getProfile();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async updateRetailerLoginDevice(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateRetailerLoginDevice(req.body, req.params.id, req.user.Id);
    sendResponse(res, 200, true, data, Manager.UPDATE_SUCCESSFULLY_DEVICE_STATUS);
  }

  async getRetailerLoginDevice(req: AuthRequest, res: Response) {
    const data = await this.managerService.getRetailerLoginDevice(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, Manager.UPDATE_SUCCESSFULLY_DEVICE_STATUS);
  }

  async getCustomerList(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerList(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, Manager.UPDATE_SUCCESSFULLY_DEVICE_STATUS);
  }

  async getProductList(req: AuthRequest, res: Response) {
    const data = await this.managerService.getProductList(req.body as PaginationOptions);
    sendResponse(res, 200, true, data, Manager.UPDATE_SUCCESSFULLY_DEVICE_STATUS);
  }

  async getProductListWithTax(req: AuthRequest, res: Response) {
    const data = await this.managerService.getProductListWithTax(req.body as PaginationOptions);
    sendResponse(res, 200, true, data, Manager.UPDATE_SUCCESSFULLY_DEVICE_STATUS);
  }

  async uploadProductImage(req: AuthRequest, res: Response) {
    const data = await this.managerService.uploadProductImage(req.body, req);
    sendResponse(res, 200, true, data, Manager.PRODUCT_IMAGE_UPLOADED);
  }

  async updateProductImage(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateProductImage(req.body, req, Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.PRODUCT_IMAGE_UPLOADED);
  }
  async createBanner(req: AuthRequest, res: Response) {
    const data = await this.managerService.createBanner(req.body, req);
    sendResponse(res, 200, true, data, Manager.BANNER_CREATE_SUCCESFULLY);
  }
  async updateBanner(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateBanner(req.body, req, Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.BANNER_UPDATE_SUCCESFULLY);
  }
  async getBannerList(req: AuthRequest, res: Response) {
    const data = await this.managerService.getBannerList();
    sendResponse(res, 200, true, data, Manager.BANNER_LIST_SUCCESFULLY);
  }
  async deleteBanner(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteBanner(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.BANNER_DELETE_SUCCESFULLY);
  }

  //  async createBanner(req: AuthRequest, res: Response) {
  //     const data = await this.managerService.createBanner(req.body,req.user.Id);
  //     sendResponse(res, 200, true, data, Manager.BANNER_CREATE_SUCCESFULLY);
  //   }
  async getVendorList(req: AuthRequest, res: Response) {
    const data = await this.managerService.getVendorList(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, Manager.FETCH_VENDOR_LIST_SUCCESS);
  }
  async getAccountReceivablesList(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAccountReceivablesList(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, Manager.FETCH_AR_LIST_SUCCESS);
  }
  async getProductById(req: AuthRequest, res: Response) {
    const itemNumber = Number(req.params.itemNumber);
    const data = await this.managerService.getProductById(itemNumber);
    sendResponse(res, 200, true, data, Manager.PRODUCT_FETCHED_SUCCESSFULLY);
  }

  async getRetailerSignUp(req: AuthRequest, res: Response) {
    const data = await this.managerService.getRetailerSignUp(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateRetailerSignUp(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateRetailerSignUp(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getUserList(req: AuthRequest, res: Response) {
    const data = await this.managerService.getUserList(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async createUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.createUser(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async createEpickUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.createEpickUser(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async createReceivableUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.createReceivableUser(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateReceivableUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateReceivableUser(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateUser(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async deleteUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteUser(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateEpickUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateEpickUser(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateEpickUserPreferences(req: AuthRequest, res: Response) {
    const userId = Number(req.params.userId);
    if (!userId || isNaN(userId)) {
      return sendResponse(res, 400, false, null, "Invalid user ID");
    }

    const { order_type, shortby, item_sort_by } = req.body;

    if (!order_type && !shortby && !item_sort_by) {
      return sendResponse(res, 400, false, null, "At least one preference (order_type, shortby, or item_sort_by) must be provided");
    }

    const data = await this.managerService.updateEpickUserPreferences(userId, { order_type, shortby, item_sort_by });
    sendResponse(res, 200, true, data, "Epick user order preferences updated successfully");
  }

  async updateEpickUserCategories(req: AuthRequest, res: Response) {
    const userId = Number(req.params.userId);
    if (!userId || isNaN(userId)) {
      return sendResponse(res, 400, false, null, "Invalid user ID");
    }

    const { category } = req.body;

    if (!category || !Array.isArray(category)) {
      return sendResponse(res, 400, false, null, "Category must be a non-empty array");
    }

    const data = await this.managerService.updateEpickUserCategories(userId, category);
    sendResponse(res, 200, true, data, "Epick user categories updated successfully");
  }

  async updateEpickUserItemSort(req: AuthRequest, res: Response) {
    const userId = Number(req.params.userId);
    if (!userId || isNaN(userId)) {
      return sendResponse(res, 400, false, null, "Invalid user ID");
    }

    const { item_sort_by } = req.body;
    if (!item_sort_by) {
      return sendResponse(res, 400, false, null, "item_sort_by is required");
    }

    const data = await this.managerService.updateEpickUserItemSort(userId, item_sort_by);
    sendResponse(res, 200, true, data, "Epick user item sort preference updated successfully");
  }

  async getEpickUserDetails(req: AuthRequest, res: Response) {
    const data = await this.managerService.getEpickUserDetails();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getPickRightAreasForEpick(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPickRightAreasForEpick();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getEpickReports(req: AuthRequest, res: Response) {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    if (userId && isNaN(userId)) {
      return sendResponse(res, 400, false, null, "Invalid userId parameter");
    }
    const data = await this.managerService.getEpickReports(userId, req.query as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async deleteEpickUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteEpickUser(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async createRolePermissions(req: AuthRequest, res: Response) {
    const data = await this.managerService.createRolePermissions(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async updateRolePermissions(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateRolePermissions(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getUserRolePermissions(req: AuthRequest, res: Response) {
    const userId = Number(req.params.id); // Convert string to number
    const data = await this.managerService.getUserRolePermissions(userId);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async updateSalesRepSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateSalesRepSetting(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateRetailerSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateRetailerSetting(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async updateItemGlobalSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateItemGlobalSetting(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async updateWarehouseProfileSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateWarehouseProfileSetting(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async uploadWarehouseImage(req: AuthRequest, res: Response) {
    const data = await this.managerService.uploadWarehouseImage(req);
    sendResponse(res, 200, true, data, Manager.WAREHOUSE_IMAGE_UPLOADED);
  }
  async getAccountReceivableTotals(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAccountReceivableTotals();
    sendResponse(res, 200, true, data, Manager.FETCH_AR_TOTALS_SUCCESS);
  }

  async getWarehouseSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.getWarehouseSetting();
    sendResponse(res, 200, true, data, Manager.WAREHOUSE_SETTING_FETCHED);
  }

  async getWarehouseContactDetails(req: AuthRequest, res: Response) {
    const data = await this.managerService.getWarehouseContactDetails();
    sendResponse(res, 200, true, data, Manager.WAREHOUSE_CONTACT_DETAILS_FETCHED);
  }

  async getOrderHistory(req: AuthRequest, res: Response) {
    const data = await this.managerService.getOrderHistory(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async getOrderForPickListConfirmation(req: AuthRequest, res: Response) {
    const data = await this.managerService.getOrderForPickListConfirmation(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getOrderHistoryByOrderNumber(req: AuthRequest, res: Response) {
    const data = await this.managerService.getOrderHistoryByOrderNumber(Number(req.params.id), req.query as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getOrderDetailByOrderNumberForInvoice(req: AuthRequest, res: Response) {
    const data = await this.managerService.getOrderDetailByOrderNumberForInvoice(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getHomeSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.getHomeSetting();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateHomeSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateHomeSetting(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getNewItemsManualSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.getNewItemsManualSetting();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateNewItemsManualSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateNewItemsManualSetting(req.body as IManualItemsSetting);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getPopularItemsModeSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPopularItemsModeSetting();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updatePopularItemsModeSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updatePopularItemsModeSetting(req.body as IPopularItemsModeSetting);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getProductInformation(req: AuthRequest, res: Response) {
    const data = await this.managerService.getProductInformation(req.body as IGetProductInformation);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getOrderDeliveryStatus(req: AuthRequest, res: Response) {
    const data = await this.managerService.getOrderDeliveryStatus(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateEmailNotification(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateEmailNotification(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  // ItemLimit CRUD controller methods
  async createItemLimit(req: AuthRequest, res: Response) {
    const data = await this.managerService.createItemLimit(req.body);
    sendResponse(res, 201, true, data, Manager.ITEM_LIMIT_CREATED_SUCCESSFULLY);
  }

  async getItemLimitById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getItemLimitById(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.ITEM_LIMIT_FETCHED_SUCCESSFULLY);
  }

  async getItemLimitByItemNumber(req: AuthRequest, res: Response) {
    const data = await this.managerService.getItemLimitByItemNumber(req.params.itemNumber);
    sendResponse(res, 200, true, data, Manager.ITEM_LIMIT_FETCHED_SUCCESSFULLY);
  }

  async getAllItemLimits(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllItemLimits(req.query as PaginationOptions & { search?: string });
    sendResponse(res, 200, true, data, Manager.ITEM_LIMIT_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateItemLimit(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateItemLimit(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, Manager.ITEM_LIMIT_UPDATED_SUCCESSFULLY);
  }

  async deleteItemLimit(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteItemLimit(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  // NotificationScheduler controller methods
  async createNotificationScheduler(req: AuthRequest, res: Response) {
    const data = await this.managerService.createNotificationScheduler(req.body as ICreateNotificationScheduler);
    sendResponse(res, 201, true, data, 'Notification scheduler created successfully');
  }

  async getAllNotificationSchedulers(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllNotificationSchedulers(req.query as PaginationOptions & IGetNotificationSchedulers);
    sendResponse(res, 200, true, data, 'Notification schedulers retrieved successfully');
  }

  async getNotificationSchedulerById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getNotificationSchedulerById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Notification scheduler retrieved successfully');
  }

  async updateNotificationScheduler(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateNotificationScheduler(Number(req.params.id), req.body as IUpdateNotificationScheduler);
    sendResponse(res, 200, true, data, 'Notification scheduler updated successfully');
  }

  async deleteNotificationScheduler(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteNotificationScheduler(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Notification scheduler deleted successfully');
  }

  async getNotificationSchedulersByUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.getNotificationSchedulersByUser(Number(req.params.userId), req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'User notification schedulers retrieved successfully');
  }

  async toggleNotificationSchedulerStatus(req: AuthRequest, res: Response) {
    const data = await this.managerService.toggleNotificationSchedulerStatus(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Notification scheduler status toggled successfully');
  }

  async getSupportTicket(req: AuthRequest, res: Response) {
    const data = await this.managerService.getSupportTicket(req.query as PaginationOptions, req.params.status);
    sendResponse(res, 200, true, data, 'Support ticket retrieved successfully');
  }

  async updateSupportTicket(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateSupportTicket(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Support ticket updated successfully');
  }


  async setCustomerLimit(req: AuthRequest, res: Response) {
    const data = await this.managerService.setCustomerLimit(req.body, Number(req.params.id));
    sendResponse(res, 200, true, data, 'Customer limit set successfully');
  }

  async updateRetailer(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateRetailer(req.body, Number(req.params.id));
    sendResponse(res, 200, true, data, 'Retailer updated successfully');
  }

  // Link CRUD controller methods
  async createLink(req: AuthRequest, res: Response) {
    const data = await this.managerService.createLink(req.body as ICreateLink, req);
    sendResponse(res, 201, true, data, Manager.LINK_CREATED_SUCCESSFULLY);
  }

  async getLinkById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getLinkById(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.LINK_FETCHED_SUCCESSFULLY);
  }

  async getAllLinks(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllLinks(req.query as PaginationOptions & { search?: string; isActive?: boolean });
    sendResponse(res, 200, true, data, Manager.LINK_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateLink(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateLink(Number(req.params.id), req.body as IUpdateLink, req);
    sendResponse(res, 200, true, data, Manager.LINK_UPDATED_SUCCESSFULLY);
  }

  async deleteLink(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteLink(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.LINK_DELETED_SUCCESSFULLY);
  }

  async toggleLinkStatus(req: AuthRequest, res: Response) {
    const data = await this.managerService.toggleLinkStatus(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.LINK_STATUS_TOGGLED_SUCCESSFULLY);
  }

  // Story CRUD controller methods
  async createStory(req: AuthRequest, res: Response) {
    const data = await this.managerService.createStory(req.body as ICreateStory, req);
    sendResponse(res, 201, true, data, Manager.STORY_CREATED_SUCCESSFULLY);
  }

  async getStoryById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getStoryById(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.STORY_FETCHED_SUCCESSFULLY);
  }

  async getAllStories(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllStories(req.query as PaginationOptions & IGetStories);
    sendResponse(res, 200, true, data, Manager.STORY_LIST_FETCHED_SUCCESSFULLY);
  }




  async updateStory(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateStory(Number(req.params.id), req.body as IUpdateStory, req);
    sendResponse(res, 200, true, data, Manager.STORY_UPDATED_SUCCESSFULLY);
  }

  async deleteStory(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteStory(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.STORY_DELETED_SUCCESSFULLY);
  }

  async toggleStoryStatus(req: AuthRequest, res: Response) {
    const data = await this.managerService.toggleStoryStatus(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.STORY_STATUS_TOGGLED_SUCCESSFULLY);
  }

  // RetailerProductCatalog CRUD controller methods
  async createRetailerProductCatalog(req: AuthRequest, res: Response) {
    const data = await this.managerService.createRetailerProductCatalog(req.body as ICreateRetailerProductCatalog, req);
    sendResponse(res, 201, true, data, Manager.RETAILER_PRODUCT_CATALOG_CREATED_SUCCESSFULLY);
  }

  async getAllRetailerProductCatalogs(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllRetailerProductCatalogs(req.query as PaginationOptions & IGetRetailerProductCatalogs);
    sendResponse(res, 200, true, data, Manager.RETAILER_PRODUCT_CATALOG_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateRetailerProductCatalog(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateRetailerProductCatalog(Number(req.params.id), req.body as IUpdateRetailerProductCatalog, req);
    sendResponse(res, 200, true, data, Manager.RETAILER_PRODUCT_CATALOG_UPDATED_SUCCESSFULLY);
  }

  async deleteRetailerProductCatalog(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteRetailerProductCatalog(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.RETAILER_PRODUCT_CATALOG_DELETED_SUCCESSFULLY);
  }

  // WebView CRUD controller methods
  async createWebView(req: AuthRequest, res: Response) {
    const data = await this.managerService.createWebView(req.body as ICreateWebView, req);
    sendResponse(res, 201, true, data, Manager.WEBVIEW_CREATED_SUCCESSFULLY);
  }

  async getWebViewById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getWebViewById(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.WEBVIEW_FETCHED_SUCCESSFULLY);
  }

  async getAllWebViews(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllWebViews(req.query as PaginationOptions & IGetWebViews);
    sendResponse(res, 200, true, data, Manager.WEBVIEW_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateWebView(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateWebView(Number(req.params.id), req.body as IUpdateWebView, req);
    sendResponse(res, 200, true, data, Manager.WEBVIEW_UPDATED_SUCCESSFULLY);
  }

  async deleteWebView(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteWebView(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.WEBVIEW_DELETED_SUCCESSFULLY);
  }

  async getWebViewsBySection(req: AuthRequest, res: Response) {
    const section = req.params.section as 'header' | 'middle' | 'bottom';
    const data = await this.managerService.getWebViewsBySection(section);
    sendResponse(res, 200, true, data, Manager.WEBVIEW_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateWebViewProducts(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateWebViewProducts(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, Manager.WEBVIEW_UPDATED_SUCCESSFULLY);
  }

  async getWebViewsGroupedBySection(req: AuthRequest, res: Response) {
    const data = await this.managerService.getWebViewsGroupedBySection(req.query as PaginationOptions & IGetWebViews);
    sendResponse(res, 200, true, data, Manager.WEBVIEW_GROUPED_FETCHED_SUCCESSFULLY);
  }

  async getAllWebViewsGrouped(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllWebViewsGrouped();
    sendResponse(res, 200, true, data, Manager.WEBVIEW_GROUPED_FETCHED_SUCCESSFULLY);
  }

  // Retailer Request CRUD controller methods
  async createRetailerRequest(req: AuthRequest, res: Response) {
    // Handle uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Process file URLs and add them to the request body
    if (files) {
      console.log(files, 'files -->')
      if (files.resale_certificate_url && files.resale_certificate_url[0]) {
        const file = files.resale_certificate_url[0];
        const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, 'retailer-request');
        if (result.success) {
          req.body.resale_certificate_url = result.url;
        }
        // You might want to save the file buffer to disk or cloud storage here
        // For now, we'll use the filename/originalname
      }
      if (files.state_tobacco_license_url && files.state_tobacco_license_url[0]) {
        const file = files.state_tobacco_license_url[0];
        const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, 'retailer-request');
        if (result.success) {
          req.body.state_tobacco_license_url = result.url;
        }
      }
      if (files.business_license_url && files.business_license_url[0]) {
        const file = files.business_license_url[0];
        const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, 'retailer-request');
        if (result.success) {
          req.body.business_license_url = result.url;
        }
      }
      if (files.owner_government_id_url && files.owner_government_id_url[0]) {
        const file = files.owner_government_id_url[0];
        const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, 'retailer-request');
        if (result.success) {
          req.body.owner_government_id_url = result.url;
        }
      }
    }

    const data = await this.managerService.createRetailerRequest(req.body);
    sendResponse(res, 201, true, data, 'Retailer request created successfully');
  }

  async getRetailerRequestById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getRetailerRequestById(req.params.id);
    sendResponse(res, 200, true, data, 'Retailer request fetched successfully');
  }

  async getAllRetailerRequests(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllRetailerRequests(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'Retailer requests fetched successfully');
  }

  async updateRetailerRequest(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateRetailerRequest(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Retailer request updated successfully');
  }

  async deleteRetailerRequest(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteRetailerRequest(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Retailer request deleted successfully');
  }

  async updateRetailerRequestStatus(req: AuthRequest, res: Response) {
    const { status, notes } = req.body;
    const data = await this.managerService.updateRetailerRequestStatus(Number(req.params.id), status, notes);
    sendResponse(res, 200, true, data, 'Retailer request status updated successfully');
  }

  // Policies CRUD controller methods
  async createPolicies(req: AuthRequest, res: Response) {
    const data = await this.managerService.createPolicies(req.body);
    sendResponse(res, 201, true, data, 'Policies created successfully');
  }

  async createPurchaseOrder(req: AuthRequest, res: Response) {
    const data = await this.managerService.createPurchaseOrder(req.body, req.user.Id);
    sendResponse(res, 201, true, data, 'PO Header created successfully');
  }

  async getPolicies(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPolicies();
    sendResponse(res, 200, true, data, 'Policies retrieved successfully');
  }

  async updatePolicies(req: AuthRequest, res: Response) {
    const data = await this.managerService.updatePolicies(req.body);
    sendResponse(res, 200, true, data, 'Policies updated successfully');
  }

  async updateRefundPolicies(req: AuthRequest, res: Response) {
    const { RefundPolicies } = req.body;
    const data = await this.managerService.updateRefundPolicies(RefundPolicies);
    sendResponse(res, 200, true, data, 'Refund policies updated successfully');
  }

  async deletePolicies(req: AuthRequest, res: Response) {
    const data = await this.managerService.deletePolicies();
    sendResponse(res, 200, true, data, 'Policies deleted successfully');
  }

  // WebCategory CRUD controller methods
  async createWebCategory(req: AuthRequest, res: Response) {
    const data = await this.managerService.createWebCategory(req.body, req);
    sendResponse(res, 201, true, data, 'Web category created successfully');
  }

  async getAllWebCategories(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllWebCategories(req.query);
    sendResponse(res, 200, true, data, 'Web categories retrieved successfully');
  }

  async getWebCategoryById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.managerService.getWebCategoryById(parseInt(id));
    sendResponse(res, 200, true, data, 'Web category retrieved successfully');
  }

  async updateWebCategory(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.managerService.updateWebCategory(parseInt(id), req.body, req);
    sendResponse(res, 200, true, data, 'Web category updated successfully');
  }

  async deleteWebCategory(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.managerService.deleteWebCategory(parseInt(id));
    sendResponse(res, 200, true, data, 'Web category deleted successfully');
  }

  // WebPriceClass CRUD controller methods
  async createWebPriceClass(req: AuthRequest, res: Response) {
    const data = await this.managerService.createWebPriceClass(req.body, req);
    sendResponse(res, 201, true, data, 'Web price class created successfully');
  }

  async getAllWebPriceClasses(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllWebPriceClasses(req.query);
    sendResponse(res, 200, true, data, 'Web price classes retrieved successfully');
  }

  async getWebPriceClassById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.managerService.getWebPriceClassById(parseInt(id));
    sendResponse(res, 200, true, data, 'Web price class retrieved successfully');
  }

  async updateWebPriceClass(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.managerService.updateWebPriceClass(parseInt(id), req.body, req);
    sendResponse(res, 200, true, data, 'Web price class updated successfully');
  }

  async deleteWebPriceClass(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.managerService.deleteWebPriceClass(parseInt(id));
    sendResponse(res, 200, true, data, 'Web price class deleted successfully');
  }

  // WebQuickLink CRUD controller methods
  async createWebQuickLink(req: AuthRequest, res: Response) {
    const data = await this.managerService.createWebQuickLink(req.body);
    sendResponse(res, 201, true, data, 'Web quick link created successfully');
  }

  async getAllWebQuickLinks(req: AuthRequest, res: Response) {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      search: req.query.search ? String(req.query.search) : ''
    };
    const data = await this.managerService.getAllWebQuickLinks(query);
    sendResponse(res, 200, true, data, 'Web quick links retrieved successfully');
  }

  async getWebQuickLinkById(req: AuthRequest, res: Response) {
    const id = parseInt(req.params.id);
    const data = await this.managerService.getWebQuickLinkById(id);
    sendResponse(res, 200, true, data, 'Web quick link retrieved successfully');
  }

  async updateWebQuickLink(req: AuthRequest, res: Response) {
    const id = parseInt(req.params.id);
    const data = await this.managerService.updateWebQuickLink(id, req.body, req);
    sendResponse(res, 200, true, data, 'Web quick link updated successfully');
  }

  async deleteWebQuickLink(req: AuthRequest, res: Response) {
    const id = parseInt(req.params.id);
    const data = await this.managerService.deleteWebQuickLink(id);
    sendResponse(res, 200, true, data, 'Web quick link deleted successfully');
  }

  // WebLocation CRUD controller methods
  async createWebLocation(req: AuthRequest, res: Response) {
    const data = await this.managerService.createWebLocation(req.body);
    sendResponse(res, 201, true, data, 'Web location created successfully');
  }

  async getAllWebLocations(req: AuthRequest, res: Response) {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      search: req.query.search ? String(req.query.search) : ''
    };
    const data = await this.managerService.getAllWebLocations(query);
    sendResponse(res, 200, true, data, 'Web locations retrieved successfully');
  }

  async getWebLocationById(req: AuthRequest, res: Response) {
    const id = parseInt(req.params.id);
    const data = await this.managerService.getWebLocationById(id);
    sendResponse(res, 200, true, data, 'Web location retrieved successfully');
  }

  async updateWebLocation(req: AuthRequest, res: Response) {
    const id = parseInt(req.params.id);
    const data = await this.managerService.updateWebLocation(id, req.body);
    sendResponse(res, 200, true, data, 'Web location updated successfully');
  }

  async deleteWebLocation(req: AuthRequest, res: Response) {
    const id = parseInt(req.params.id);
    const data = await this.managerService.deleteWebLocation(id);
    sendResponse(res, 200, true, data, 'Web location deleted successfully');
  }

  async setUserDiscountLimit(req: AuthRequest, res: Response) {
    const data = await this.managerService.setUserDiscountLimit(Number(req.params.id), req.body.setUserDiscountLimit);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerCalenderList(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerCalenderList(req.body as PaginationOptions);
    sendResponse(res, 200, true, data, 'Customer calender list fetched successfully');
  }

  async getCustomerOrderByCalenderDate(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerOrderByCalenderDate(req.body);
    sendResponse(res, 200, true, data, 'Customer calender list fetched successfully');
  }

  async getCustomerTotalOrderByCustomer(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerTotalOrderByCustomer(req.body);
    sendResponse(res, 200, true, data, 'Customer total order by customer fetched successfully');
  }

  async getCustomerOrderOfCurrentWeek(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerOrderOfCurrentWeek(req.query as PaginationOptions, Number(req.params.customerId));
    sendResponse(res, 200, true, data, 'Customer order of current week fetched successfully');
  }


  async getCustomerByIdInfoInCalender(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerByIdInfoInCalender(Number(req.params.customerId));
    sendResponse(res, 200, true, data, 'Customer by id info in calender fetched successfully');
  }

  // ContactUs CRUD controller methods
  async createContactUs(req: AuthRequest, res: Response) {
    const data = await this.managerService.createContactUs(req.body);
    sendResponse(res, 201, true, data, 'Contact us information created successfully');
  }

  async getContactUsById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getContactUsById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Contact us information retrieved successfully');
  }

  async getAllContactUs(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllContactUs(req.query as PaginationOptions & { search?: string });
    sendResponse(res, 200, true, data, 'Contact us information list retrieved successfully');
  }

  async updateContactUs(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateContactUs(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Contact us information updated successfully');
  }

  async deleteContactUs(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteContactUs(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Contact us information deleted successfully');
  }

  // EmailModule CRUD controller methods
  async createEmailModule(req: AuthRequest, res: Response) {
    const data = await this.managerService.createEmailModule(req.body);
    sendResponse(res, 201, true, data, 'Email module created successfully');
  }

  async getEmailModuleById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getEmailModuleById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Email module retrieved successfully');
  }

  async getAllEmailModules(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllEmailModules(req.query as PaginationOptions & { search?: string });
    sendResponse(res, 200, true, data, 'Email modules list retrieved successfully');
  }

  async updateEmailModule(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateEmailModule(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Email module updated successfully');
  }

  async deleteEmailModule(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteEmailModule(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Email module deleted successfully');
  }

  // EmailModuleConfig CRUD controller methods
  async createEmailModuleConfig(req: AuthRequest, res: Response) {
    const data = await this.managerService.createEmailModuleConfig(req.body);
    sendResponse(res, 201, true, data, 'Email module config created successfully');
  }

  async getEmailModuleConfigById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getEmailModuleConfigById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Email module config retrieved successfully');
  }

  async getAllEmailModuleConfigs(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllEmailModuleConfigs(req.query as PaginationOptions & {
      search?: string;
      emailModuleId?: number;
      isActive?: boolean
    });
    sendResponse(res, 200, true, data, 'Email module configs list retrieved successfully');
  }

  async updateEmailModuleConfig(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateEmailModuleConfig(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Email module config updated successfully');
  }

  async deleteEmailModuleConfig(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteEmailModuleConfig(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Email module config deleted successfully');
  }

  // CustomerAssignInvoiceTemplate CRUD controller methods
  async createCustomerAssignInvoiceTemplate(req: AuthRequest, res: Response) {
    const data = await this.managerService.createCustomerAssignInvoiceTemplate(req.body);
    sendResponse(res, 201, true, data, 'Customer invoice template assignment created successfully');
  }

  async getCustomerAssignInvoiceTemplateById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerAssignInvoiceTemplateById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Customer invoice template assignment retrieved successfully');
  }

  async getAllCustomerAssignInvoiceTemplates(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllCustomerAssignInvoiceTemplates(req.query as PaginationOptions & {
      search?: string;
      customerNumber?: number;
      templateId?: number
    });
    sendResponse(res, 200, true, data, 'Customer invoice template assignments list retrieved successfully');
  }

  async updateCustomerAssignInvoiceTemplate(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateCustomerAssignInvoiceTemplate(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Customer invoice template assignment updated successfully');
  }

  async deleteCustomerAssignInvoiceTemplate(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteCustomerAssignInvoiceTemplate(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Customer invoice template assignment deleted successfully');
  }

  async deleteCustomerAssignInvoiceTemplateByCustomerNumber(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteCustomerAssignInvoiceTemplateByCustomerNumber(Number(req.params.customerNumber));
    sendResponse(res, 200, true, data, 'Customer invoice template assignment deleted successfully');
  }

  async bulkAddCustomerAssignInvoiceTemplates(req: AuthRequest, res: Response) {
    const data = await this.managerService.bulkAddCustomerAssignInvoiceTemplates(req.body);
    sendResponse(res, 201, true, data, data.message);
  }

  async bulkRemoveCustomerAssignInvoiceTemplates(req: AuthRequest, res: Response) {
    const data = await this.managerService.bulkRemoveCustomerAssignInvoiceTemplates(req.body);
    sendResponse(res, 200, true, data, data.message);
  }

  // InvoiceTemplate CRUD controller methods
  async createInvoiceTemplate(req: AuthRequest, res: Response) {
    const data = await this.managerService.createInvoiceTemplate(req.body);
    sendResponse(res, 201, true, data, 'Invoice template created successfully');
  }

  async getInvoiceTemplateById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInvoiceTemplateById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Invoice template retrieved successfully');
  }

  async getAllInvoiceTemplates(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllInvoiceTemplates(req.query as PaginationOptions & {
      search?: string;
      mainTemplate?: boolean;
    });
    sendResponse(res, 200, true, data, 'Invoice templates list retrieved successfully');
  }

  async updateInvoiceTemplate(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateInvoiceTemplate(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Invoice template updated successfully');
  }

  async deleteInvoiceTemplate(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteInvoiceTemplate(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Invoice template deleted successfully');
  }

  async getCustomerInvoiceTemplate(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerInvoiceTemplate(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Customer invoice template retrieved successfully');
  }

  async getCustomerByInvoiceId(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerByInvoiceId(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Customer by invoice id retrieved successfully');
  }


  async getCustomerListForTradeShow(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerListForTradeShow(req.body as PaginationOptions & { search?: string, Inactive?: string, cot?: string[], routes?: string[] });
    sendResponse(res, 200, true, data, 'Customer list for trade show retrieved successfully');
  }

  // Email Management CRUD controller methods
  async createEmailConfig(req: AuthRequest, res: Response) {
    const data = await this.managerService.createEmailConfig(req.body);
    sendResponse(res, 201, true, data, 'Email configuration created successfully');
  }

  async getEmailConfigById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getEmailConfigById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Email configuration retrieved successfully');
  }

  async getAllEmailConfigs(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllEmailConfigs(req.query as PaginationOptions & { search?: string; userId?: number; isActive?: boolean });
    sendResponse(res, 200, true, data, 'Email configurations retrieved successfully');
  }

  async updateEmailConfig(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateEmailConfig(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Email configuration updated successfully');
  }

  async deleteEmailConfig(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteEmailConfig(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Email configuration deleted successfully');
  }

  async getEmailConfigsByUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.getEmailConfigsByUser(Number(req.params.userId), req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'User email configurations retrieved successfully');
  }

  async toggleEmailConfigStatus(req: AuthRequest, res: Response) {
    const data = await this.managerService.toggleEmailConfigStatus(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Email configuration status toggled successfully');
  }


  async testEmailConfig(req: AuthRequest, res: Response) {
    const data = await this.managerService.testEmailConfig(req.body);
    sendResponse(res, 200, true, data, 'Email configuration tested successfully');
  }

  async testEmail(req: AuthRequest, res: Response) {
    const data = await this.managerService.testEmail(req.body);
    sendResponse(res, 200, true, data, 'Email configuration tested successfully');
  }


  async testEmailMarketing(req: AuthRequest, res: Response) {
    const data = await this.managerService.testEmailMarketing(req.body);
    sendResponse(res, 200, true, data, 'Email marketing tested successfully');
  }
  // Email Marketing CRUD controller methods
  async createEmailMarketing(req: AuthRequest, res: Response) {
    const data = await this.managerService.createEmailMarketing(req.body);
    sendResponse(res, 201, true, data, 'Email marketing campaign created successfully');
  }

  async getEmailMarketingById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getEmailMarketingById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Email marketing campaign retrieved successfully');
  }

  async getAllEmailMarketing(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllEmailMarketing(req.query as PaginationOptions & { search?: string; userId?: number });
    sendResponse(res, 200, true, data, 'Email marketing campaigns retrieved successfully');
  }

  async getEmailMarketingByUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.getEmailMarketingByUser(Number(req.params.userId), req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'User email marketing campaigns retrieved successfully');
  }

  async uploadAttachment(req: AuthRequest, res: Response) {
    const data = await this.managerService.uploadAttachment(req);
    sendResponse(res, 200, true, data, 'Attachment uploaded successfully');
  }

  async sendEmailToCampaign(req: AuthRequest, res: Response) {
    const data = await this.managerService.sendEmailToCampaign(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Email marketing campaign sent successfully');
  }

  async getGenerateBarcodeAndUpload(req: AuthRequest, res: Response) {
    const data = await this.managerService.getGenerateBarcodeAndUpload(req.body.text);
    sendResponse(res, 200, true, data, 'Barcode generated and uploaded successfully');
  }


  async createInventory(req: AuthRequest, res: Response) {
    const data = await this.managerService.createInventory(req.body);
    sendResponse(res, 201, true, data, 'Inventory created successfully');
  }

  async createVendor(req: AuthRequest, res: Response) {
    const data = await this.managerService.createVendor(req.body);
    sendResponse(res, 201, true, data, 'Vendor created successfully');
  }

  async createErpUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.createErpUser(req.body);
    sendResponse(res, 201, true, data, 'ERP User created successfully');
  }

  async updateErpUser(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateErpUser(Number(req.params.id), req.body)
    sendResponse(res, 200, true, data, 'ERP User updated successfully')
  }

  async getAllErpUsers(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllErpUsers();
    sendResponse(res, 200, true, data, "ERP Users fetched successfully");
  }

  async getAllCheckerUsers(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllCheckerUsers();
    sendResponse(res, 200, true, data, "Checker users fetched successfully");
  }

  async getErpUserById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getErpUserById(Number(req.params.id))
    sendResponse(res, 200, true, data, "ERP User fetched successfully");
  }

  async editInventory(req: AuthRequest, res: Response) {
    const data = await this.managerService.editInventory(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Inventory edited successfully');
  }

  async editUpcNumber(req: AuthRequest, res: Response) {
    const data = await this.managerService.editUpcNumber(Number(req.params.key), req.body.upcNumber);
    sendResponse(res, 200, true, data, 'UPC number edited successfully');
  }

  // InventoryUPC CRUD controller methods
  async createInventoryUPC(req: AuthRequest, res: Response) {
    const data = await this.managerService.createInventoryUPC(req.body);
    sendResponse(res, 201, true, data, 'InventoryUPC created successfully');
  }

  async getInventoryByItemNumber(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryByItemNumber(Number(req.params.itemNumber));
    sendResponse(res, 200, true, data, 'Inventory retrieved successfully');
  }

  async getInventoryUPCById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryUPCById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'InventoryUPC retrieved successfully');
  }

  async getInventoryForReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryForReport();
    res.end(JSON.stringify(data));
    // sendResponse(res, 200, true, data, 'InventoryUPC retrieved successfully');
  }

  async getCustomerForReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerForReport();
    // res.end(JSON.stringify(data));
    sendResponse(res, 200, true, data, 'Customer details retrieved successfully');
  }


  async updateInventoryUPC(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateInventoryUPC(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'InventoryUPC updated successfully');
  }

  async deleteInventoryUPC(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteInventoryUPC(Number(req.params.id));
    sendResponse(res, 200, true, data, 'InventoryUPC deleted successfully');
  }

  async getInventoryUPCByItemNumber(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryUPCByItemNumber(req.params.itemNumber);
    sendResponse(res, 200, true, data, 'InventoryUPCs by item number retrieved successfully');
  }

  async getInventoryUPCByJurisdiction(req: AuthRequest, res: Response) {
    const { jurisdictionState, jurisdictionCounty, jurisdictionCity } = req.query;
    const data = await this.managerService.getInventoryUPCByJurisdiction(
      Number(jurisdictionState),
      jurisdictionCounty ? Number(jurisdictionCounty) : undefined,
      jurisdictionCity ? Number(jurisdictionCity) : undefined
    );
    sendResponse(res, 200, true, data, 'InventoryUPCs by jurisdiction retrieved successfully');
  }

  async checkUPCExists(req: AuthRequest, res: Response) {
    const { upc } = req.params;
    const data = await this.managerService.checkUPCExists(upc);
    sendResponse(res, 200, true, data, data ? "UPC exists " : "UPC not found");
  }

  // EpickSetting CRUD controller methods
  async createEpickSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.createEpickSetting(req.body);
    sendResponse(res, 201, true, data, 'Epick setting created successfully');
  }

  // InvoiceSetting controller methods
  async createInvoiceSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.createInvoiceSetting(req.body);
    sendResponse(res, 201, true, data, 'Invoice setting created successfully');
  }

  async updateInvoiceSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateInvoiceSetting(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Invoice setting updated successfully');
  }

  async getEpickSettingById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getEpickSettingById(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getAllEpickSettings(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllEpickSettings(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateEpickSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateEpickSetting(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Epick setting updated successfully');
  }

  async deleteEpickSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteEpickSetting(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Epick setting deleted successfully');
  }

  async createCustomer(req: AuthRequest, res: Response) {
    const body = req.body.jsonData ? JSON.parse(req.body.jsonData) : req.body;
    if (!body.C_Name) {
      throw new AppError('Customer name is required', 400);
    }
    const data = await this.managerService.createCustomer({ ...body, files: req.files });
    sendResponse(res, 201, true, data, 'Customer created successfully');
  }

  async updateUserAllowDiscount(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateUserAllowDiscount(req.body, Number(req.params.id));
    sendResponse(res, 200, true, data, 'User allow discount updated successfully');
  }

  async updateCustomer(req: AuthRequest, res: Response) {
    const body = req.body.jsonData ? JSON.parse(req.body.jsonData) : req.body;
    const data = await this.managerService.updateCustomer({ ...body, files: req.files }, Number(req.params.id));
    sendResponse(res, 200, true, data, 'Customer updated successfully');
  }
  async updateVendor(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateVendor(req.body, Number(req.params.id))
    sendResponse(res, 200, true, data, 'Vendor updated successfully')
  }

  async getVendorById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getVendorById(Number(req.params.id))
    sendResponse(res, 200, true, data, 'Vendor retrieved successfully')
  }
  async getCustomerDetailsById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerDetailsById(Number(req.params.id))
    sendResponse(res, 200, true, data, 'Customer details retrieved successfully')
  }

  async getInventoryItemsForUpdate(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryItemsForUpdate(req.body)
    sendResponse(res, 200, true, data, 'Inventory items for update retrieved successfully')
  }

  async bulkUpdateInventory(req: AuthRequest, res: Response) {
    const data = await this.managerService.bulkUpdateInventory(req.body, req?.user?.id)
    sendResponse(res, 200, true, data, 'Inventory updated successfully')
  }

  // Driver CRUD controller methods
  async createDriver(req: AuthRequest, res: Response) {
    const data = await this.managerService.createDriver(req.body);
    sendResponse(res, 201, true, data, 'Driver created successfully');
  }

  async getDriverById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getDriverById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Driver retrieved successfully');
  }

  async getAllDrivers(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllDrivers(req.query as PaginationOptions & { search?: string });
    sendResponse(res, 200, true, data, 'Drivers retrieved successfully');
  }

  async updateDriver(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateDriver(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Driver updated successfully');
  }

  async deleteDriver(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteDriver(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Driver deleted successfully');
  }

  async updateDriverLocation(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateDriverLocation(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Driver location updated successfully');
  }

  // Vehicle CRUD controller methods
  async createVehicle(req: AuthRequest, res: Response) {
    const data = await this.managerService.createVehicle(req.body);
    sendResponse(res, 201, true, data, 'Vehicle created successfully');
  }

  async getVehicleById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getVehicleById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Vehicle retrieved successfully');
  }

  async getAllVehicles(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllVehicles(req.query as PaginationOptions & { search?: string; isActive?: boolean });
    sendResponse(res, 200, true, data, 'Vehicles retrieved successfully');
  }

  async updateVehicle(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateVehicle(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Vehicle updated successfully');
  }

  async deleteVehicle(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteVehicle(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Vehicle deleted successfully');
  }

  async getAllOrderNumbers(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllOrderNumbers();
    sendResponse(res, 200, true, data, 'Order numbers retrieved successfully');
  }

  async getAllOrderNumbersByCustomer(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllOrderNumbersByCustomer(req.body);
    sendResponse(res, 200, true, data, 'Order numbers retrieved successfully');
  }

  async distributorUpdate(req: AuthRequest, res: Response) {
    const pmId = req.user.id;
    const data = await this.managerService.distributorUpdate(Number(pmId), req.body);
    sendResponse(res, 200, true, data, 'Distributor updated successfully');
  }
  // Picklist CRUD Controller Methods
  async createPicklist(req: AuthRequest, res: Response) {
    const data = await this.managerService.createPicklist(req.body);
    sendResponse(res, 201, true, data, 'Picklist created successfully');
  }

  async getAllPicklists(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllPicklists(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'Picklists retrieved successfully');
  }

  async getPicklistById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPicklistById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Picklist retrieved successfully');
  }

  async updatePicklist(req: AuthRequest, res: Response) {
    const data = await this.managerService.updatePicklist(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Picklist updated successfully');
  }

  async deletePicklist(req: AuthRequest, res: Response) {
    const data = await this.managerService.deletePicklist(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Picklist deleted successfully');
  }

  async makePickListPrinted(req: AuthRequest, res: Response) {
    const data = await this.managerService.makePickListPrinted(Number(req.params.orderNumber));
    sendResponse(res, 200, true, data, 'Picklist printed successfully');
  }

  async makeBulkPickListPrinted(req: AuthRequest, res: Response) {
    const data = await this.managerService.makeBulkPickListPrinted(req.body.orderNumbers);
    sendResponse(res, 200, true, data, 'Bulk picklist printed successfully');
  }

  // FuturePricing CRUD controller methods
  async createFuturePricing(req: AuthRequest, res: Response) {
    const data = await this.managerService.createFuturePricing(req.body);
    sendResponse(res, 201, true, data, Manager.FUTURE_PRICING_CREATED_SUCCESSFULLY);
  }

  async getFuturePricingById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getFuturePricingById(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.FUTURE_PRICING_FETCHED_SUCCESSFULLY);
  }

  async getAllFuturePricings(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllFuturePricings(req.query as PaginationOptions & {
      search?: string;
      itemNumber?: number;
      isApplied?: boolean;
      changedBy?: 'admin' | 'user';
    });
    sendResponse(res, 200, true, data, Manager.FUTURE_PRICING_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateFuturePricing(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateFuturePricing(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, Manager.FUTURE_PRICING_UPDATED_SUCCESSFULLY);
  }

  async deleteFuturePricing(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteFuturePricing(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.FUTURE_PRICING_DELETED_SUCCESSFULLY);
  }

  async uploadImages(req: AuthRequest, res: Response) {
    const data = await this.managerService.uploadImages(req);
    sendResponse(res, 200, true, data, 'Images uploaded successfully');
  }

  async getInventoryItemGroups(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryItemGroups();
    sendResponse(res, 201, true, data, 'Inventory item group get successfully');
  }

  async createInventoryItemGroup(req: AuthRequest, res: Response) {
    const data = await this.managerService.createInventoryItemGroup(req.body);
    sendResponse(res, 201, true, data, 'Inventory item group created successfully');
  }


  async updateInventoryItemGroup(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateInventoryItemGroup(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Inventory item group updated successfully');
  }

  async getinventorybrands(req: AuthRequest, res: Response) {
    const data = await this.managerService.getinventorybrands();
    sendResponse(res, 201, true, data, 'Inventory Brand get successfully');
  }

  async createInventoryBrand(req: AuthRequest, res: Response) {
    const data = await this.managerService.createInventoryBrand(req.body);
    sendResponse(res, 201, true, data, 'Inventory brand created successfully');
  }

  async updateInventoryBrand(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateInventoryBrand(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Inventory brand updated successfully');
  }

  async getPriceClass(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPriceClass();
    sendResponse(res, 201, true, data, 'Price Class get successfully');
  }

  async updatePriceClass(req: AuthRequest, res: Response) {
    const data = await this.managerService.updatePriceClass(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Web price class updated successfully');
  }

  // async getLossQuantityReport(req: AuthRequest, res: Response) {
  //   const filters = {...parseReportFilters(req.query),
  //     groupBy: (req.query.groupBy as any) || 'item',
  //   };

  //   const data = await this.managerService.getLossQuantityReport(filters);

  //   sendResponse(res, 200, true, data, 'Loss quantity report fetched successfully');
  // }

  // RetailerDocuments CRUD controller methods
  async createRetailerDocuments(req: AuthRequest, res: Response) {
    const data = await this.managerService.createRetailerDocuments(req.body);
    sendResponse(res, 201, true, data, Manager.RETAILER_DOCUMENTS_CREATED_SUCCESSFULLY);
  }

  async getRetailerDocumentsById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getRetailerDocumentsById(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.RETAILER_DOCUMENTS_FETCHED_SUCCESSFULLY);
  }

  async getAllRetailerDocuments(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllRetailerDocuments(req.query as PaginationOptions & {
      search?: string;
      customerNumber?: number;
    });
    sendResponse(res, 200, true, data, Manager.RETAILER_DOCUMENTS_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateRetailerDocuments(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateRetailerDocuments(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, Manager.RETAILER_DOCUMENTS_UPDATED_SUCCESSFULLY);
  }

  async deleteRetailerDocuments(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteRetailerDocuments(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.RETAILER_DOCUMENTS_DELETED_SUCCESSFULLY);
  }

  // RetailerLocation CRUD controller methods
  async createRetailerLocation(req: AuthRequest, res: Response) {
    const data = await this.managerService.createRetailerLocation(req.body);
    sendResponse(res, 201, true, data, Manager.RETAILER_LOCATION_CREATED_SUCCESSFULLY);
  }

  async getRetailerLocationById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getRetailerLocationById(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.RETAILER_LOCATION_FETCHED_SUCCESSFULLY);
  }

  async getAllRetailerLocations(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllRetailerLocations(req.query as PaginationOptions & {
      search?: string;
      C_Number?: number;
    });
    sendResponse(res, 200, true, data, Manager.RETAILER_LOCATION_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateRetailerLocation(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateRetailerLocation(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, Manager.RETAILER_LOCATION_UPDATED_SUCCESSFULLY);
  }

  async deleteRetailerLocation(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteRetailerLocation(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.RETAILER_LOCATION_DELETED_SUCCESSFULLY);
  }


  // async getVelocityReportCustomerGroup(req: AuthRequest, res: Response) {
  //   const parsedFilters = parseReportFilters(req.query);

  //   const filters = {
  //     ...parsedFilters,
  //   } as CommonReportFilters;

  //   const data = await this.managerService.getVelocityReportCustomerGroup(filters);

  //   sendResponse(res, 200, true, data, 'Velocity report fetched successfully');
  // }

  // controller
  async getShortShipmentReport(req: AuthRequest, res: Response) {
    const fromDate = typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined;
    const toDate = typeof req.query.toDate === 'string' ? req.query.toDate : undefined;
    const data = await this.managerService.getShortShipmentReport({ fromDate, toDate });
    sendResponse(res, 200, true, data, 'Short shipment report fetched successfully');
  }

  async getVelocityReportCustomer(req: AuthRequest, res: Response) {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const page = typeof req.query.page === 'string' ? Math.max(parseInt(req.query.page, 10), 1) : 1;
    const limit = typeof req.query.limit === 'string' ? Math.min(parseInt(req.query.limit, 10), 500) : 50000; // hard cap for safety
    const data = await this.managerService.getVelocityReportCustomer({ startDate, endDate, page, limit, });
    sendResponse(res, 200, true, data, 'Customer Velocity report fetched successfully');
  }

  async getVelocityReportSalesRep(req: AuthRequest, res: Response) {
    const data = await this.managerService.getVelocityReportSalesRep(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerVelocityReportPoints(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerVelocityReportPoints(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerVelocityReportPointsItem(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerVelocityReportPointsItem(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async setRetailerLocation(req: AuthRequest, res: Response) {
    const data = await this.managerService.setRetailerLocation(req.body);
    sendResponse(res, 201, true, data, 'Retailer location set successfully');
  }

  async getAllOrderForDriver(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllOrderForDriver(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'All order for driver fetched successfully');
  }

  async getDeliverRouteByGoogleMap(req: AuthRequest, res: Response) {
    const data = await this.managerService.getDeliverRouteByGoogleMap(req.body);
    sendResponse(res, 200, true, data, 'Deliver route by google map fetched successfully');
  }

  async getRouteCreatedOrders(req: AuthRequest, res: Response) {
    const data = await this.managerService.getRouteCreatedOrders(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'Route created orders fetched successfully');
  }

  async createDeliveryRoute(req: AuthRequest, res: Response) {
    const data = await this.managerService.createDeliveryRoute(req.body);
    sendResponse(res, 201, true, data, 'Delivery route created successfully');
  }

  async getDeliveryRoutes(req: AuthRequest, res: Response) {
    const data = await this.managerService.getDeliveryRoutes(req.body as PaginationOptions & {
      routeId?: number;
      day?: string;
      driverId?: number;
      routeStatus?: string;
      includeStops?: boolean;
      includeChildren?: boolean;
    });
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async getARreports(req: AuthRequest, res: Response) {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : '';
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : '';
    const page = typeof req.query.page === 'string' ? Math.max(parseInt(req.query.page, 10), 1) : 1;
    const limit = typeof req.query.limit === 'string' ? Math.min(parseInt(req.query.limit, 10)) : undefined;
    const data = await this.managerService.getARreports({ startDate, endDate, page, limit, });
    sendResponse(res, 200, true, data, 'Account Receivable report fetched successfully');
  }

  async getARreportsHistory(req: AuthRequest, res: Response) {
    const data = await this.managerService.getARreportsHistory(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  // PreBook CRUD controller methods
  async createPreBook(req: AuthRequest, res: Response) {
    const data = await this.managerService.createPreBook(req.body);
    sendResponse(res, 201, true, data, 'PreBook created successfully');
  }

  async getPreBookById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPreBookById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'PreBook fetched successfully');
  }

  async getAllPreBooks(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllPreBooks(req.query as PaginationOptions & { search?: string; startDate?: string; endDate?: string });
    sendResponse(res, 200, true, data, 'PreBooks fetched successfully');
  }

  async updatePreBook(req: AuthRequest, res: Response) {
    const data = await this.managerService.updatePreBook(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'PreBook updated successfully');
  }

  async deletePreBook(req: AuthRequest, res: Response) {
    const data = await this.managerService.deletePreBook(Number(req.params.id));
    sendResponse(res, 200, true, data, 'PreBook deleted successfully');
  }
  async getArStatementReport(req: AuthRequest, res: Response) {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : '';
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : '';
    const page = typeof req.query.page === 'string' ? Math.max(parseInt(req.query.page, 10), 1) : 1;
    const limit = typeof req.query.limit === 'string' ? Math.min(parseInt(req.query.limit, 10)) : undefined;
    const data = await this.managerService.getArStatementReport({ startDate, endDate, page, limit, });
    sendResponse(res, 200, true, data, 'Account  report fetched successfully');
  }


  async getOpenItemReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getOpenItemReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  // TradeShow CRUD controller methods
  async createTradeShow(req: AuthRequest, res: Response) {

    const findActiveTradeShow = await this.managerService.findActiveTradeShow();
    if (findActiveTradeShow) {
      throw new AppError('Active trade show already exists', 400);
    }

    const data = await this.managerService.createTradeShow(req.body);
    sendResponse(res, 201, true, data, 'TradeShow created successfully');
  }

  async getTradeShowById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShow fetched successfully');
  }

  async getAllTradeShows(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllTradeShows(req.query as PaginationOptions & {
      search?: string;
      status?: string;
      tradeShowDate?: string;
      deliveryStartDate?: string;
      deliveryEndDate?: string;
    });
    sendResponse(res, 200, true, data, 'TradeShows fetched successfully');
  }

  async updateTradeShow(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateTradeShow(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'TradeShow updated successfully');
  }

  async deleteTradeShow(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteTradeShow(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShow deleted successfully');
  }



  async deActiveTradeShow(req: AuthRequest, res: Response) {
    const data = await this.managerService.deActiveTradeShow(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShow deactivated successfully');
  }

  // TradeShowItem CRUD controller methods
  async createTradeShowItem(req: AuthRequest, res: Response) {
    const data = await this.managerService.createTradeShowItem(req.body);
    sendResponse(res, 201, true, data, 'TradeShowItem created successfully');
  }

  async getTradeShowItemById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowItemById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShowItem fetched successfully');
  }

  async getAllTradeShowItems(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllTradeShowItems(req.query as PaginationOptions & {
      tradeShowId?: number;
      itemNumber?: string;
      disType?: "PERCENT" | "FLAT";
    });
    sendResponse(res, 200, true, data, 'TradeShowItems fetched successfully');
  }

  async updateTradeShowItem(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateTradeShowItem(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'TradeShowItem updated successfully');
  }

  async deleteTradeShowItem(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteTradeShowItem(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShowItem deleted successfully');
  }

  async createBulkTradeShowItems(req: AuthRequest, res: Response) {
    const data = await this.managerService.createBulkTradeShowItems(req.body);
    sendResponse(res, 201, true, data, `${data.count} TradeShowItem(s) created successfully`);
  }

  async updateBulkTradeShowItems(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateBulkTradeShowItems(req.body);
    sendResponse(res, 200, true, data, `${data.count} TradeShowItem(s) updated successfully`);
  }

  // TradeShowRetailer CRUD controller methods
  async createTradeShowRetailer(req: AuthRequest, res: Response) {
    const data = await this.managerService.createTradeShowRetailer(req.body);
    sendResponse(res, 201, true, data, 'TradeShowRetailer created successfully');
  }

  async createBulkTradeShowRetailers(req: AuthRequest, res: Response) {
    const data = await this.managerService.createBulkTradeShowRetailers(req.body);
    sendResponse(res, 201, true, data, `${data.count} TradeShowRetailer association(s) created successfully`);
  }

  async getTradeShowRetailerById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowRetailerById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShowRetailer fetched successfully');
  }

  async getAllTradeShowRetailers(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllTradeShowRetailers(req.query as PaginationOptions & {
      tradeShowId?: number;
      retailerId?: number;
    });
    sendResponse(res, 200, true, data, 'TradeShowRetailers fetched successfully');
  }

  async updateTradeShowRetailer(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateTradeShowRetailer(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'TradeShowRetailer updated successfully');
  }

  async deleteTradeShowRetailer(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteTradeShowRetailer(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShowRetailer deleted successfully');
  }

  // TradeShowVendor CRUD controller methods
  async createTradeShowVendor(req: AuthRequest, res: Response) {
    const data = await this.managerService.createTradeShowVendor(req.body);
    sendResponse(res, 201, true, data, 'TradeShowVendor created successfully');
  }

  async createBulkTradeShowVendors(req: AuthRequest, res: Response) {
    const data = await this.managerService.createBulkTradeShowVendors(req.body);
    sendResponse(res, 201, true, data, `${data.count} TradeShowVendor association(s) created successfully`);
  }

  async getTradeShowVendorById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowVendorById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShowVendor fetched successfully');
  }

  async getAllTradeShowVendors(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllTradeShowVendors(req.query as PaginationOptions & {
      tradeShowId?: number;
      vendorId?: number;
    });
    sendResponse(res, 200, true, data, 'TradeShowVendors fetched successfully');
  }

  async updateTradeShowVendor(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateTradeShowVendor(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'TradeShowVendor updated successfully');
  }

  async deleteTradeShowVendor(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteTradeShowVendor(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShowVendor deleted successfully');
  }

  // TradeShowDeliveryProduct CRUD controller methods
  async createTradeShowDeliveryProduct(req: AuthRequest, res: Response) {
    const data = await this.managerService.createTradeShowDeliveryProduct(req.body);
    sendResponse(res, 201, true, data, 'TradeShowDeliveryProduct created successfully');
  }
  async createBulkTradeShowDeliveryProducts(req: AuthRequest, res: Response) {
    const data = await this.managerService.createBulkTradeShowDeliveryProducts(req.body);
    sendResponse(res, 201, true, data, `${data.count} TradeShowDeliveryProduct(s) created successfully`);
  }

  async getTradeShowDeliveryProductById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowDeliveryProductById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShowDeliveryProduct fetched successfully');
  }

  async getAllTradeShowDeliveryProducts(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllTradeShowDeliveryProducts(req.query as PaginationOptions & {
      tradeShowId?: number;
      itemNumber?: string;
      weekNumber?: number;
      deliveryType?: "pickup" | "delivery";
    });
    sendResponse(res, 200, true, data, 'TradeShowDeliveryProducts fetched successfully');
  }

  async getRemainItemInDelivery(req: AuthRequest, res: Response) {
    const data = await this.managerService.getRemainItemInDelivery(req.body as PaginationOptions);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateTradeShowDeliveryProduct(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateTradeShowDeliveryProduct(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'TradeShowDeliveryProduct updated successfully');
  }

  async deleteTradeShowDeliveryProduct(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteTradeShowDeliveryProduct(Number(req.params.id));
    sendResponse(res, 200, true, data, 'TradeShowDeliveryProduct deleted successfully');
  }

  async getARUndepositeFund(req: AuthRequest, res: Response) {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : '';
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : '';
    const data = await this.managerService.getARUndepositeFund(startDate, endDate);
    sendResponse(res, 200, true, data, 'Account Receivable Undeposite Fund report fetched successfully');
  }

  async getARDeletedPayment(req: AuthRequest, res: Response) {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : '';
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : '';
    const data = await this.managerService.getARDeletedPayment({ startDate, endDate });
    sendResponse(res, 200, true, data, 'AR Deleted report fetched successfully');
  }

  async getInventoryValuationSalesCategTotal(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryValuationSalesCategTotal();
    sendResponse(res, 200, true, data, 'Inventory Valuation Sales_Categories Total fetched successfully');
  }
  async getAgingReport(req: AuthRequest, res: Response) {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : '';
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : '';
    const data = await this.managerService.getAgingReport({ startDate, endDate });
    sendResponse(res, 200, true, data, 'AR Deleted report fetched successfully');
  }


  async getInventoryAsPerVendorIds(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryAsPerVendorIds(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getInventoryAsPerTradeWeek(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryAsPerTradeWeek(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async getVendorListForTradeShowIds(req: AuthRequest, res: Response) {
    const data = await this.managerService.getVendorListForTradeShowIds(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async getInventorySpotCheck(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventorySpotCheck();
    sendResponse(res, 200, true, data, 'Inventory Spot Check fetched successfully');
  }

  async getTradeShowSummary(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowSummary(Number(req.params.id), req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getTradeShowItemList(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowItemList(Number(req.params.id), req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getTradeShowVendorsList(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowVendorsList(Number(req.params.id), req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async deleteBulkTradeShowVendors(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteBulkTradeShowVendors(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async deleteBulkTradeShowItems(req: AuthRequest, res: Response) {

    const data = await this.managerService.deleteBulkTradeShowItems(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async deleteBulkTradeShowDeliveryProducts(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteBulkTradeShowDeliveryProducts(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async deleteBulkTradeShowRetailers(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteBulkTradeShowRetailers(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getProductsByOrderNumber(req: AuthRequest, res: Response) {
    const data = await this.managerService.getProductsByOrderNumber(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getTradeShowItemForEdit(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowItemForEdit(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getTradeDeliverProductsForEdit(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeDeliverProductsForEdit(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async getTradeDeliveryProductSummary(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeDeliveryProductSummary(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async getTradeShowRetailerForEdit(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTradeShowRetailerForEdit(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async currentOrderStatusReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.currentOrderStatusReport(req.query);
    sendResponse(res, 200, true, data, 'Current Order Status Report fetched successfully');

  }

  async currentOrderDetailStatus(req: AuthRequest, res: Response) {
    const orderNumber = Number(req.params.orderNumber);
    const data = await this.managerService.currentOrderDetailStatus(orderNumber);
    sendResponse(res, 200, true, data, 'Current Order Detail Status fetched successfully');
  }

  async poReceivingHistoryReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.poReceivingHistoryReport(req.query);
    sendResponse(res, 200, true, data, 'PO Receiving History Report fetched successfully');
  }


  async poTransferAdjustmentReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.poTransferAdjustmentReport(req.query);
    sendResponse(res, 200, true, data, 'PO Transfer/Adjustment Report fetched successfully');
  }

  async poCigOtpReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.poCigOtpReport(req.query);
    sendResponse(res, 200, true, data, 'PO Cig OTP Report fetched successfully');
  }

  async createInvoice(req: AuthRequest, res: Response) {
    const orderNumber = Number(req.params.orderNumber);
    const data = await this.managerService.createInvoice(orderNumber);
    sendResponse(res, 200, true, data, 'Invoice created successfully');
  }
  async getInvoiceRegister(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInvoiceRegister(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async uploadItemImage(req: AuthRequest, res: Response) {
    const data = await this.managerService.uploadItemImage(req);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async bulkUploadItemImages(req: AuthRequest, res: Response) {
    const data = await this.managerService.bulkUploadItemImages(req.body.items);
    sendResponse(res, 200, true, data, data.success ? 'Item images uploaded successfully' : 'Some items failed to upload');
  }

  async getCustomerListForEmailModules(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerListForEmailModules();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  // ProductDiscount controller methods
  async createProductDiscount(req: AuthRequest, res: Response) {
    const data = await this.managerService.createProductDiscount(req.body);
    sendResponse(res, 201, true, data, Manager.PRODUCT_DISCOUNT_CREATED_SUCCESSFULLY);
  }

  async getProductDiscountById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getProductDiscountById(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.PRODUCT_DISCOUNT_FETCHED_SUCCESSFULLY);
  }

  async getAllProductDiscounts(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllProductDiscounts(req.query as PaginationOptions & {
      search?: string;
      ItemNumber?: number;
      isActive?: boolean;
    });
    sendResponse(res, 200, true, data, Manager.PRODUCT_DISCOUNT_LIST_FETCHED_SUCCESSFULLY);
  }

  async updateProductDiscount(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateProductDiscount(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, Manager.PRODUCT_DISCOUNT_UPDATED_SUCCESSFULLY);
  }

  async deleteProductDiscount(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteProductDiscount(Number(req.params.id));
    sendResponse(res, 200, true, data, Manager.PRODUCT_DISCOUNT_DELETED_SUCCESSFULLY);
  }

  async syncProductDiscountsToRedis(req: AuthRequest, res: Response) {
    const data = await this.managerService.syncProductDiscountsToRedisManual();
    sendResponse(res, 200, true, data, 'Product discounts synced to Redis successfully');
  }

  async getProductDiscountsFromRedis(req: AuthRequest, res: Response) {
    const { itemNumber, date, getAll } = req.query;

    const query: any = {};
    if (itemNumber) query.itemNumber = Number(itemNumber);
    if (date) query.date = date as string;
    if (getAll === 'true') query.getAll = true;

    const data = await this.managerService.getProductDiscountsFromRedis(query);
    sendResponse(res, 200, true, data, 'Product discounts fetched from Redis successfully');
  }

  async getDiscountedPriceFromRedis(req: AuthRequest, res: Response) {
    const { itemNumber, quantity, originalPrice } = req.body;

    if (!itemNumber || quantity === undefined || originalPrice === undefined) {
      return sendResponse(res, 400, false, null, 'itemNumber, quantity, and originalPrice are required');
    }

    const data = await this.managerService.getDiscountedPriceFromRedisService(
      Number(itemNumber),
      Number(quantity),
      Number(originalPrice)
    );
    sendResponse(res, 200, true, data, 'Discounted price calculated successfully');
  }
  async getTodayCount(req: AuthRequest, res: Response) {
    const data = await this.managerService.getTodayCount(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS)
  }

  async getActiveMobileDevice(req: AuthRequest, res: Response) {
    const data = await this.managerService.getActiveMobileDevice();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerLastSaleReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerLastSaleReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerNoSalesReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerNoSalesReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getInventoryLogHistory(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryLogHistory(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerWithProfit(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerWithProfit(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerRankingSales(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerRankingSales(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getDailySalesReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getDailySalesReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerPrepaidSalesTax(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerPrepaidSalesTax(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getDeletedOrders(req: AuthRequest, res: Response) {
    const data = await this.managerService.getDeletedOrders(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getPriceClassRebatesReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPriceClassRebatesReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getPriceClassGroupRebatesReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPriceClassGroupRebatesReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getLostSaleCurrentOrders(req: AuthRequest, res: Response) {
    const data = await this.managerService.getLostSaleCurrentOrders();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getSalesInvoiceReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getSalesInvoiceReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async getInventoryWithStatusAndTax(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInventoryWithStatusAndTax(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getExpirationDateReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getExpirationDateReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async buyerGuideInventoryHistory(req: AuthRequest, res: Response) {
    const data = await this.managerService.buyerGuideInventoryHistory(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getVelocityReportVendorGroup(req: AuthRequest, res: Response) {
    const data = await this.managerService.getVelocityReportVendorGroup(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getVelocityReportOtpPrice(req: AuthRequest, res: Response) {
    const data = await this.managerService.getVelocityReportOtpPrice(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getVelocityReportOtpCigSticks(req: AuthRequest, res: Response) {
    const data = await this.managerService.getVelocityReportOtpCigSticks(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getSalesTaxOtpTaxReports(req: AuthRequest, res: Response) {
    const data = await this.managerService.getSalesTaxOtpTaxReports(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getPOAdjustItemGroupReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPOAdjustItemGroupReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getPOOpenOrdersReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPOOpenOrdersReport();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCurrentOrderStatusReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCurrentOrderStatusReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getInvoiceRegisterCostReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInvoiceRegisterCostReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getPicklistOrderDetail(req: AuthRequest, res: Response) {
    const data = await this.managerService.getPicklistOrderDetail(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getDeletedOrdersHistory(req: AuthRequest, res: Response) {
    const data = await this.managerService.getDeletedOrdersHistory(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getShortShippedOrders(req: AuthRequest, res: Response) {
    const data = await this.managerService.getShortShippedOrders();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCustomerPricing(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerPricing(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getInvoiceReprint(req: AuthRequest, res: Response) {
    const data = await this.managerService.getInvoiceReprint(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getItemGroupPromotionMaintenanceReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getItemGroupPromotionMaintenanceReport(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  async updateDeliveryRoute(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateDeliveryRoute(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }


  async updateSetting(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateSetting(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getSettingDeliveryAddress(req: AuthRequest, res: Response) {
    const data = await this.managerService.getSettingDeliveryAddress();
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCreatedRoutes(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCreatedRoutes(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getRouteFullStops(req: AuthRequest, res: Response) {
    const data = await this.managerService.getRouteFullStops(Number(req.params.id));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getStopFullDetails(req: AuthRequest, res: Response) {
    const data = await this.managerService.getStopFullDetails(Number(req.params.stopId));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getRouteFullReport(req: AuthRequest, res: Response) {
    const data = await this.managerService.getRouteFullReport(Number(req.params.routeId));
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async createManualRoute(req: AuthRequest, res: Response) {
    const data = await this.managerService.createManualRoute(req.body);
    sendResponse(res, 201, true, data, General.SUCCESS);
  }

  async uploadBulkImages(req: AuthRequest, res: Response) {
    const data = await this.managerService.uploadBulkImages(req);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async updateDeliveryRouteDriverVehicle(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateDeliveryRouteDriverVehicle(
      Number(req.params.id),
      req.body
    );
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async getCancelledStops(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCancelledStops(req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async cancelStop(req: AuthRequest, res: Response) {
    const data = await this.managerService.cancelStop(
      Number(req.params.stopId),
      req.body
    );
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

}