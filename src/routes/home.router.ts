import { Router } from "express";
import { HomeController } from "../controllers/home.controller";
import { multerUpload } from "../middlewares/upload.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { createRetailerRequestSchema } from "../validations/manager.validation";
import { catchAsync } from "../utils/catchAsync";

const router = Router();
const homeController = new HomeController();

router.get('/bannerList', homeController.getBannerList.bind(homeController));
router.get('/newItem', homeController.getNewItem.bind(homeController));
router.get('/specialItems', homeController.getSpecialItems.bind(homeController));
router.get('/adverstismentImage', homeController.getAdverstismentImage.bind(homeController));
router.get('/popularItems', homeController.getPopularItems.bind(homeController));
router.get('/promotedItems', homeController.getPromotedItems.bind(homeController));
router.get('/productCategory', homeController.getProductCategory.bind(homeController));
router.get('/productByCategoryList', homeController.getProductByCategoryList.bind(homeController));
router.post('/productList', homeController.getProductList.bind(homeController));
router.get('/salesCategoryList', homeController.getSalesCategoryList.bind(homeController));
router.get('/priceClassList', homeController.getPriceClassList.bind(homeController));
router.get('/usefulLink', homeController.getUseFulLink.bind(homeController));
router.get('/contactUs', homeController.getContactUs.bind(homeController));
router.get('/webPriceClass', homeController.getWebPriceClass.bind(homeController));
router.post('/retailer-requests', 
    multerUpload.fields([
      { name: 'resale_certificate_url', maxCount: 1 },
      { name: 'state_tobacco_license_url', maxCount: 1 },
      { name: 'business_license_url', maxCount: 1 },
      { name: 'owner_government_id_url', maxCount: 1 }
    ]),
    validateRequest(createRetailerRequestSchema), 
    catchAsync(homeController.createRetailerRequest.bind(homeController))
  );

export default router;