import { SalesController } from "../controllers/sales.controller";
import { ROLES } from "../interfaces/request.body.interface";
import verifyRole from "../middlewares/verifyUser.middleware";
import { catchAsync } from "../utils/catchAsync";
import { Router } from "express";
import { changePasswordSchema } from "../validations/auth.validation";
import { validateRequest } from "../middlewares/validation.middleware";
import { verifySalesSession } from "../middlewares/sales.middleware";
import { createSalesCallTimeSchema, updateSalesCallTimeSchema, createSalesNoteSchema, updateSalesNoteSchema, createOrderConfirmationSchema, updateOrderConfirmationSchema, inventoryUPCValidation } from "../validations/sales.validation";


const router = Router();
 const listController = new SalesController();

router.get('/profile',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getProfile.bind(listController)));
router.post('/changePassword',verifyRole(ROLES.CHECKER, ROLES.SALES),validateRequest(changePasswordSchema),catchAsync(listController.changePassword.bind(listController)));
router.post('/setSalesSession/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.setSalesSession.bind(listController)));
router.get('/customerList',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getCustomerList.bind(listController)));
router.post('/customerListPaginated',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getCustomerListAsPerSalesRep.bind(listController)));


router.get('/orderHistoryByOrderNumber/:orderNumber',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getOrderHistoryByOrderNumber.bind(listController)));
router.get('/orderHistory/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getOrderHistory.bind(listController)));
router.post('/placeOrder/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.placeOrder.bind(listController)));
router.post('/placeTradeShowOrder/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.placeTradeShowOrder.bind(listController)));

// return order

router.post('/returnPlaceOrder/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.returnPlaceOrder.bind(listController)));
router.post('/getInventoryItems/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getInventoryItems.bind(listController)));
router.post('/getTradeShowItems/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getTradeShowItems.bind(listController)));
router.get('/getInventoryShowPrepaidTax', verifyRole(ROLES.SALES),catchAsync(listController.getInventoryShowPrepaidTax.bind(listController)));
router.post('/getInventoryItemsBySalesMan/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getInventoryItemsBySalesMan.bind(listController)));

router.get('/cartItem/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getCartItem.bind(listController)));
router.delete('/cartItem/:cartItemId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.removeFromCart.bind(listController)));
router.delete('/clearCart/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.clearCart.bind(listController)));
router.delete('/clearTradeShowCart/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.clearTradeShowCart.bind(listController)));
router.put('/cartItem/:cartItemId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.updateCartItem.bind(listController)));
router.put('/updateTradeShowCartItem/:cartItemId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.updateTradeShowCartItem.bind(listController)));
router.post('/addToCart/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.addToCart.bind(listController)));
router.delete('/removeFromTradeShowCart/:cartItemId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.removeFromTradeShowCart.bind(listController)));
router.post('/addToReturnCart/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.addToReturnCart.bind(listController)));
router.post('/addToTradeShowCart/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.addToTradeShowCart.bind(listController)));
router.get('/getReturnCartItems/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getReturnCartItems.bind(listController)));
router.get('/getTradeShowCartItems/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getTradeShowCartItems.bind(listController)));
router.post('/addToCartByType/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.addToCartByType.bind(listController)));
router.get('/getReturnCartItemsByType/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getReturnCartItemsByType.bind(listController)));



router.get('/orderHistoryByProductNumber', 
    verifyRole(ROLES.CHECKER, ROLES.SALES), verifySalesSession,
    catchAsync(listController.getOrderHistoryByProductNumber.bind(listController))
  );

  router.get('/orderPdf/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getPdfOfOrderDetails.bind(listController)));
  router.get('/orderDeliveryStatus/:id',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getOrderDeliveryStatus.bind(listController)));
  router.get('/deliveryCharge/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getDeliveryCharge.bind(listController)));
  router.get('/customerListPaginated',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getCustomerListAsPerSalesRep.bind(listController)));    
  router.get('/customerOrderedProducts/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getCustomerOrderedProducts.bind(listController)));

  router.post('/customerOrderedProductsV1/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getCustomerOrderedProductsV1.bind(listController)));
  router.get('/bannerList',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getBannerList.bind(listController)));
  router.get('/accountReceivablesList/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.getAccountReceivablesList.bind(listController)));

  router.post('/removeMultipleItemsFromCart',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.removeMultipleItemsFromCart.bind(listController)));

  router.get('/scanItemByBarcode/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.scanItemByBarcode.bind(listController)));
  router.post('/cart/addMultipleItems/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.addMultipleItems.bind(listController)));
  router.get('/addToCartByScanner/:id',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.addToCartByScanner.bind(listController)));

  router.post('/multiScannerItems/:id',verifyRole(ROLES.CHECKER, ROLES.SALES),verifySalesSession,catchAsync(listController.addToCartMultiScanner.bind(listController)));

  router.get('/customerByIdInfoInCalender/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getCustomerByIdInfoInCalender.bind(listController)));

  router.get('/customerCalenderList',verifyRole(ROLES.CHECKER, ROLES.SALES),  catchAsync(listController.getCustomerCalenderList.bind(listController)));
  router.get('/getCustomerOrderByCalenderDate',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getCustomerOrderByCalenderDate.bind(listController)));
  
  router.get('/getCustomerOrderOfCurrentWeek/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getCustomerOrderOfCurrentWeek.bind(listController)));

  router.get('/warehouseProfile',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getWareHouseProfileDetails.bind(listController)));



  // policies
  router.get('/policies',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getPolicies.bind(listController)));

  // SalesCallTime routes
  router.post('/sales-call-time',verifyRole(ROLES.CHECKER, ROLES.SALES),validateRequest(createSalesCallTimeSchema),catchAsync(listController.createSalesCallTime.bind(listController)));
  router.put('/sales-call-time/:id',verifyRole(ROLES.CHECKER, ROLES.SALES),validateRequest(updateSalesCallTimeSchema),catchAsync(listController.updateSalesCallTime.bind(listController)));

  // SalesNote CRUD routes
  router.post('/sales-notes',verifyRole(ROLES.CHECKER, ROLES.SALES),validateRequest(createSalesNoteSchema),catchAsync(listController.createSalesNote.bind(listController)));
  router.get('/sales-notes/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getAllSalesNotes.bind(listController)));
  router.get('/sales-notes/:customerId/:salesId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getSalesNoteById.bind(listController)));
  router.put('/sales-notes/:id',verifyRole(ROLES.CHECKER, ROLES.SALES),validateRequest(updateSalesNoteSchema),catchAsync(listController.updateSalesNote.bind(listController)));
  router.delete('/sales-notes/:salesId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.deleteSalesNote.bind(listController)));
  router.get('/sales-notes-customer/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getSalesNotesByCustomer.bind(listController)));

  // InventoryUPC CRUD routes
  router.post('/upc',verifyRole(ROLES.CHECKER, ROLES.SALES),validateRequest(inventoryUPCValidation),catchAsync(listController.addUpc.bind(listController)));
  router.put('/upc/:id',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.updateUpc.bind(listController)));
  router.post('/get-upc-list',catchAsync(listController.getItemForUpc.bind(listController)));

  // OrderConfirmation CRUD routes
  router.get('/order-confirmation/details/:orderNumber',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getOrderConfirmationDetailsHistory.bind(listController)));
  router.get('/order-confirmation/list',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.orderConfirmation.bind(listController)));
  router.post('/order-confirmation',verifyRole(ROLES.CHECKER, ROLES.SALES),validateRequest(createOrderConfirmationSchema),catchAsync(listController.createOrderConfirmation.bind(listController)));
 
  router.post('/restart-order-confirmation',verifyRole(ROLES.CHECKER, ROLES.SALES),validateRequest(createOrderConfirmationSchema),catchAsync(listController.restartOrderConfirmation.bind(listController)));

  router.put('/order-confirmation/:id',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.updateOrderConfirmation.bind(listController)));
  router.put('/lock-order-confirmation/:orderNumber',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.lockOrderConfirmation.bind(listController)));
  router.delete('/order-confirmation/:id',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.deleteOrderConfirmation.bind(listController)));

  router.get('/order-confirmation/sales/:salesId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getOrderConfirmationsBySalesId.bind(listController)));

  router.get('/getSalesCategoryPriceClassByCustomer/:customerNumber',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getSalesCategoryPriceClassByCustomer.bind(listController)));
  router.get('/getSalesCategoryByCustomer/:customerNumber',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getSalesCategoryByCustomer.bind(listController)));

  router.get('/getInventoryItemsForOrderConfirmation',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getInventoryItemsForOrderConfirmation.bind(listController)));

  router.post('/placeOrderForCustomer/:customerId',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.placeOrderForCustomer.bind(listController)));
  router.put('/updateSalesCategory/:id',verifyRole(ROLES.MANAGER, ROLES.SALES),catchAsync(listController.updateSalesCategory.bind(listController)));

  router.get('/getDistributorContactDetails/:id',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getDistributorContactDetails.bind(listController)));

  router.get('/getTradeShow',verifyRole(ROLES.CHECKER, ROLES.SALES),catchAsync(listController.getTradeShow.bind(listController)));

 export default router;
