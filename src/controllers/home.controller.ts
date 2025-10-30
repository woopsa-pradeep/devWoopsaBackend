import { HomeService } from "../businesslogic/home.service";
import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import { General } from "../constants";
import { uploadFileToAzure } from "../utils/azureUploader";

export class HomeController {
    private homeService: HomeService;

    constructor() {
        this.homeService = new HomeService();
    }

    async getBannerList(req: Request, res: Response) {
        const data = await this.homeService.getBannerList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getNewItem(req: Request, res: Response) {
        const data = await this.homeService.getNewItem();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getSpecialItems(req: Request, res: Response) {
        const data = await this.homeService.getSpecialItems();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getAdverstismentImage(req: Request, res: Response) {
        const data = await this.homeService.getAdverstismentImage();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getPopularItems(req: Request, res: Response) {
        const data = await this.homeService.getPopularItems();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getPromotedItems(req: Request, res: Response) {
        const data = await this.homeService.getPromotedItems();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getProductCategory(req: Request, res: Response) {
        const data = await this.homeService.getProductCategory();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getProductByCategoryList(req: Request, res: Response) {
        const data = await this.homeService.getProductByCategoryList(req.query);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getProductList(req: Request, res: Response) {
        const data = await this.homeService.getInventoryItems(req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getSalesCategoryList(req: Request, res: Response) {
        const data = await this.homeService.getSalesCategoryList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getPriceClassList(req: Request, res: Response) {
        const data = await this.homeService.getPriceClassList();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getUseFulLink(req: Request, res: Response) {
        const data = await this.homeService.getUseFulLink();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getContactUs(req: Request, res: Response) {
        const data = await this.homeService.getContactUs();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }


    async getWebPriceClass(req: Request, res: Response) {
        const data = await this.homeService.getWebPriceClass();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async createRetailerRequest(req: Request, res: Response) {
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
    
        const data = await this.homeService.createRetailerRequest(req.body);
        sendResponse(res, 201, true, data, 'Retailer request created successfully');
      }
}