import { Response } from "express";
import { ManagerService } from "../businesslogic/manager.service";
import { General, Manager } from "../constants";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { sendResponse } from "../utils/sendResponse";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { IGetProductInformation, ICreateLink, ICreateNotificationScheduler, ICreateStory, IUpdateLink, IUpdateNotificationScheduler, IUpdateStory, IGetNotificationSchedulers, IGetStories, ICreateRetailerProductCatalog, IGetRetailerProductCatalogs, IUpdateRetailerProductCatalog, ICreateWebView, IUpdateWebView, IGetWebViews, IWebViewGroupedResponse } from "../interfaces/request.body.interface";
import { uploadFileToAzure } from "../utils/azureUploader";
import { parseReportFilters } from "../utils/parseReportFilters";
import { number } from "joi";


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
    const data = await this.managerService.getSupportTicket(req.query as PaginationOptions,req.params.status);
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
    const data = await this.managerService.updateLink(Number(req.params.id), req.body as IUpdateLink,req);
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
    const data = await this.managerService.createPurchaseOrder(req.body , req.user.Id);
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
    const data = await this.managerService.createWebCategory(req.body,req);
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
    const data = await this.managerService.updateWebCategory(parseInt(id), req.body,req);
    sendResponse(res, 200, true, data, 'Web category updated successfully');
  }

  async deleteWebCategory(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.managerService.deleteWebCategory(parseInt(id));
    sendResponse(res, 200, true, data, 'Web category deleted successfully');
  }

  // WebPriceClass CRUD controller methods
  async createWebPriceClass(req: AuthRequest, res: Response) {
    const data = await this.managerService.createWebPriceClass(req.body,req);
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
    const data = await this.managerService.updateWebPriceClass(parseInt(id), req.body,req);
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
    const data = await this.managerService.getCustomerOrderByCalenderDate(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'Customer calender list fetched successfully');
  }

  async getCustomerTotalOrderByCustomer(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerTotalOrderByCustomer(req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'Customer total order by customer fetched successfully');
  }

  async getCustomerOrderOfCurrentWeek(req: AuthRequest, res: Response) {
    const data = await this.managerService.getCustomerOrderOfCurrentWeek(req.query as PaginationOptions,Number(req.params.customerId));
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
    const data = await this.managerService.createVendor(req.body );
    sendResponse(res, 201, true, data, 'Vendor created successfully');
  }

  async createErpUser(req: AuthRequest, res: Response){
    const data = await this.managerService.createErpUser(req.body);
    sendResponse(res , 201 ,true, data, 'ERP User created successfully');
  }

  async updateErpUser(req: AuthRequest, res: Response){
    const data = await this.managerService.updateErpUser(Number(req.params.id), req.body)
    sendResponse(res, 200, true, data, 'ERP User updated successfully')
  }

  async getAllErpUsers(req: AuthRequest, res: Response){
    const data = await this.managerService.getAllErpUsers();
    sendResponse(res, 200, true, data, "ERP Users fetched successfully");
  }

  async getAllCheckerUsers(req: AuthRequest, res: Response){
    const data = await this.managerService.getAllCheckerUsers();
    sendResponse(res, 200, true, data, "Checker users fetched successfully");
  }

   async getErpUserById(req: AuthRequest, res: Response){
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
    const {  upc } = req.params;
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
    const data = await this.managerService.createCustomer(req.body);
    sendResponse(res, 201, true, data, 'Customer created successfully');
  }

  async updateUserAllowDiscount(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateUserAllowDiscount(req.body, Number(req.params.id));
    sendResponse(res, 200, true, data, 'User allow discount updated successfully');
  }
 
  async updateCustomer(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateCustomer(req.body, Number(req.params.id));
    sendResponse(res, 200, true, data, 'Customer updated successfully');
}
  async updateVendor(req: AuthRequest, res: Response){
    const data = await this.managerService.updateVendor(req.body, Number(req.params.id))
    sendResponse(res, 200, true, data, 'Vendor updated successfully')
  }

  async getVendorById(req: AuthRequest, res: Response){
    const data = await this.managerService.getVendorById(Number(req.params.id))
    sendResponse(res, 200, true, data, 'Vendor retrieved successfully')
  }
  async getCustomerDetailsById(req: AuthRequest, res: Response){
    const data = await this.managerService.getCustomerDetailsById(Number(req.params.id))
    sendResponse(res, 200, true, data, 'Customer details retrieved successfully')
  }

  async getInventoryItemsForUpdate(req: AuthRequest, res: Response){
    const data = await this.managerService.getInventoryItemsForUpdate(req.body)
    sendResponse(res, 200, true, data, 'Inventory items for update retrieved successfully')
  }

  async bulkUpdateInventory(req: AuthRequest, res: Response){
    const data = await this.managerService.bulkUpdateInventory(req.body,req?.user?.id)
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

  // DriverRouteAssignment CRUD controller methods
  async createDriverRouteAssignment(req: AuthRequest, res: Response) {
    const data = await this.managerService.createDriverRouteAssignment(req.body);
    sendResponse(res, 201, true, data, 'Driver route assignment created successfully');
  }

  async getDriverRouteAssignmentById(req: AuthRequest, res: Response) {
    const data = await this.managerService.getDriverRouteAssignmentById(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Driver route assignment retrieved successfully');
  }

  async getAllDriverRouteAssignments(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllDriverRouteAssignments(req.query as PaginationOptions & { search?: string; driverId?: number; deliveryDay?: string });
    sendResponse(res, 200, true, data, 'Driver route assignments retrieved successfully');
  }

  async updateDriverRouteAssignment(req: AuthRequest, res: Response) {
    const data = await this.managerService.updateDriverRouteAssignment(Number(req.params.id), req.body);
    sendResponse(res, 200, true, data, 'Driver route assignment updated successfully');
  }

  async deleteDriverRouteAssignment(req: AuthRequest, res: Response) {
    const data = await this.managerService.deleteDriverRouteAssignment(Number(req.params.id));
    sendResponse(res, 200, true, data, 'Driver route assignment deleted successfully');
  }

  async getDriverRouteAssignmentsByDriver(req: AuthRequest, res: Response) {
    const data = await this.managerService.getDriverRouteAssignmentsByDriver(Number(req.params.driverId), req.query as PaginationOptions);
    sendResponse(res, 200, true, data, 'Driver route assignments retrieved successfully');
  }

  async getAllOrderNumbers(req: AuthRequest, res: Response) {
    const data = await this.managerService.getAllOrderNumbers();
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
    sendResponse(res,200,true,data,'Short shipment report fetched successfully');
  }

  async getVelocityReportCustomer(req: AuthRequest, res: Response) {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const page = typeof req.query.page === 'string' ? Math.max(parseInt(req.query.page, 10), 1) : 1;
    const limit = typeof req.query.limit === 'string'? Math.min(parseInt(req.query.limit, 10), 500) : 50000; // hard cap for safety
    const data = await this.managerService.getVelocityReportCustomer({ startDate,endDate,page,limit,});
    sendResponse(res, 200, true, data, 'Customer Velocity report fetched successfully');
  }

  async getARreports(req: AuthRequest, res: Response) {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : '';
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : '';
    const page = typeof req.query.page === 'string' ? Math.max(parseInt(req.query.page, 10), 1) : 1;
    const limit = typeof req.query.limit === 'string'? Math.min(parseInt(req.query.limit, 10)) : undefined ;
    const data = await this.managerService.getARreports({ startDate,endDate,page,limit,});
    sendResponse(res, 200, true, data, 'Account Receivable report fetched successfully');
  }

  async getARreportsHistory(req: AuthRequest, res: Response) {
      const data = await this.managerService.getARreportsHistory();
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
    const limit = typeof req.query.limit === 'string'? Math.min(parseInt(req.query.limit, 10)) : undefined ;
    const data = await this.managerService.getArStatementReport({ startDate,endDate,page,limit,});
    sendResponse(res, 200, true, data, 'Account  report fetched successfully');
  }
    

  async getOpenItemReport(req: AuthRequest, res: Response) {
      const data = await this.managerService.getOpenItemReport();
      sendResponse(res, 200, true, data, General.SUCCESS);
    }

}