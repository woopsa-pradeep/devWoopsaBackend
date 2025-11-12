import { Router } from 'express';
import { RetailerController } from '../controllers/retailer.controller';
import verifyToken from '../middlewares/verifyToken.middleware';
import verifyRole from '../middlewares/verifyUser.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { ROLES } from '../interfaces/request.body.interface';
import { catchAsync } from '../utils/catchAsync';
import { 
  addToCartValidation, 
  updateCartItemValidation, 
  cartItemIdValidation, 
  createSupportTicketValidation,
  createRetailerProductCatalogSchema,
  updateRetailerProductCatalogSchema,
  getRetailerProductCatalogsQuerySchema,
  addToCartMultiScannerValidation
} from '../validations/retailer.validation';
import { placeOrderSchema } from '../validations/order.validation';
import { multerUpload } from '../middlewares/upload.middleware';


const router = Router();
const retailerController = new RetailerController();


router.get('/getNewItems',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getNewItems.bind(retailerController)));
router.post('/getInventory',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getInventoryItems.bind(retailerController)));

router.get('/getAllInventoryData',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getAllInventoryData.bind(retailerController)));
router.get('/profile',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getProfile.bind(retailerController)));
// router.get('/deliveryCharge',catchAsync(retailerController.getDeliveryCharge.bind(retailerController)));
router.get('/deliveryCharge',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getDeliveryCharge.bind(retailerController)));

router.get('/getBannerData',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getBannerData.bind(retailerController)));
router.post('/getProductData',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getProductData.bind(retailerController)));
router.get('/getBannerList',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getBannerList.bind(retailerController)));
router.get('/accountReceivables', verifyRole(ROLES.RETAILER), catchAsync(retailerController.getAccountReceivablesList.bind(retailerController)));

// Cart CRUD Routes
router.post('/cart/add', 
  verifyRole(ROLES.RETAILER), 
  validateRequest(addToCartValidation),
  catchAsync(retailerController.addToCart.bind(retailerController))
);
router.get('/cart/items', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.getCartItems.bind(retailerController))
);
router.put('/cart/items/:id', 
  verifyRole(ROLES.RETAILER), 
  validateRequest(updateCartItemValidation),
  catchAsync(retailerController.updateCartItem.bind(retailerController))
);
router.delete('/cart/items/:id', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.removeFromCart.bind(retailerController))
);
router.delete('/cart/clear', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.clearCart.bind(retailerController))
);
router.post('/cart/removeMultipleItems', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.removeMultipleItemsFromCart.bind(retailerController))
);

router.get('/cart/items/:id', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.getCartItemById.bind(retailerController))
);
router.get('/cart/summary', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.getCartSummary.bind(retailerController))
);
router.get('/warehouseProfile', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.getWareHouseProfileDetails.bind(retailerController))
);
router.post('/placeOrder', 
  verifyRole(ROLES.RETAILER), 
  validateRequest(placeOrderSchema),
  catchAsync(retailerController.placeOrder.bind(retailerController))
);
  router.get('/orderHistoryByProductNumber/:id', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.getOrderHistoryByProductNumber.bind(retailerController))
);
router.get('/orderHistory', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.getOrderHistory.bind(retailerController))
);
router.get('/orderHistoryByOrderNumber/:id', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.getOrderHistoryByOrderNumber.bind(retailerController))
);
router.post('/orderedProducts', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.
    getOrderedProducts.bind(retailerController))
);
router.get('/orderDeliveryStatus/:id',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getOrderDeliveryStatus.bind(retailerController)));
router.get('/scanItemByBarcode/:id',verifyRole(ROLES.RETAILER),catchAsync(retailerController.scanItemByBarcode.bind(retailerController)));
router.get('/getScannedItems',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getScannedItems.bind(retailerController)));
router.post('/addCartMultiScanner',validateRequest(addToCartMultiScannerValidation),verifyRole(ROLES.RETAILER),catchAsync(retailerController.addToCartMultiScanner.bind(retailerController)));

// PDF generation
router.get('/orderPdf',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getPdfOfOrderDetails.bind(retailerController)));

// notification
router.get('/notificationList',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getNotificationList.bind(retailerController)));
router.get('/readAllNotification',verifyRole(ROLES.RETAILER),catchAsync(retailerController.readAllNotification.bind(retailerController)));
router.get('/readNotification/:id',verifyRole(ROLES.RETAILER),catchAsync(retailerController.readNotification.bind(retailerController)));
router.get('/deleteNotification/:id',verifyRole(ROLES.RETAILER),catchAsync(retailerController.deleteNotification.bind(retailerController)));
router.get('/deleteAllNotification',verifyRole(ROLES.RETAILER),catchAsync(retailerController.deleteAllNotification.bind(retailerController)));


// support ticket
router.post('/createSupportTicket',verifyRole(ROLES.RETAILER),multerUpload.single('attachment'),validateRequest(createSupportTicketValidation),catchAsync(retailerController.createSupportTicket.bind(retailerController)));
router.get('/getSupportTicket',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getSupportTicket.bind(retailerController)));

// fcm token
router.put('/fcmToken',verifyRole(ROLES.RETAILER),catchAsync(retailerController.putFcmToken.bind(retailerController)));

// RetailerProductCatalog CRUD routes
router.post('/product-catalogs', 
  verifyRole(ROLES.RETAILER), 
  multerUpload.single('attachment'), 
  validateRequest(createRetailerProductCatalogSchema), 
  catchAsync(retailerController.createRetailerProductCatalog.bind(retailerController))
);

router.get('/product-catalogs', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.getAllRetailerProductCatalogs.bind(retailerController))
);

router.get('/product-catalogs/:id', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.getRetailerProductCatalogById.bind(retailerController))
);

router.put('/product-catalogs/:id', 
  verifyRole(ROLES.RETAILER), 
  multerUpload.single('attachment'), 
  catchAsync(retailerController.updateRetailerProductCatalog.bind(retailerController))
);

router.delete('/product-catalogs/:id', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.deleteRetailerProductCatalog.bind(retailerController))
);

router.patch('/product-catalogs/:id/toggle', 
  verifyRole(ROLES.RETAILER), 
  catchAsync(retailerController.toggleRetailerProductCatalogStatus.bind(retailerController))
);

// Links
router.get('/links',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getLinks.bind(retailerController)));


// story
router.get('/story',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getAllStory.bind(retailerController)));
router.put('/story/:id',verifyRole(ROLES.RETAILER),catchAsync(retailerController.viewStory.bind(retailerController)));


// policies
router.get('/policies',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getPolicies.bind(retailerController)));

// distributor contact details
router.get('/distributorContactDetails',verifyRole(ROLES.RETAILER),catchAsync(retailerController.getDistributorContactDetails.bind(retailerController)));

export default router; 
