import { SalesController } from "../controllers/sales.controller";
import { ROLES } from "../interfaces/request.body.interface";
import verifyRole from "../middlewares/verifyUser.middleware";
import { catchAsync } from "../utils/catchAsync";
import { Router } from "express";
import { changePasswordSchema } from "../validations/auth.validation";
import { validateRequest } from "../middlewares/validation.middleware";
import { verifySalesSession } from "../middlewares/sales.middleware";
import { createSalesCallTimeSchema, updateSalesCallTimeSchema, createSalesNoteSchema, updateSalesNoteSchema, createOrderConfirmationSchema, updateOrderConfirmationSchema } from "../validations/sales.validation";


const router = Router();
 const listController = new SalesController();

router.get('/profile',verifyRole(ROLES.SALES),catchAsync(listController.getProfile.bind(listController)));
router.post('/changePassword',verifyRole(ROLES.SALES),validateRequest(changePasswordSchema),catchAsync(listController.changePassword.bind(listController)));
router.post('/setSalesSession/:customerId',verifyRole(ROLES.SALES),catchAsync(listController.setSalesSession.bind(listController)));
router.get('/customerList',verifyRole(ROLES.SALES),catchAsync(listController.getCustomerList.bind(listController)));
router.post('/customerListPaginated',verifyRole(ROLES.SALES),catchAsync(listController.getCustomerListAsPerSalesRep.bind(listController)));


router.get('/orderHistoryByOrderNumber/:orderNumber',verifyRole(ROLES.SALES),catchAsync(listController.getOrderHistoryByOrderNumber.bind(listController)));
router.get('/orderHistory/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getOrderHistory.bind(listController)));
router.post('/placeOrder/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.placeOrder.bind(listController)));

// return order

router.post('/returnPlaceOrder/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.returnPlaceOrder.bind(listController)));
router.post('/getInventoryItems/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getInventoryItems.bind(listController)));
router.post('/getInventoryItemsBySalesMan/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getInventoryItemsBySalesMan.bind(listController)));

router.get('/cartItem/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getCartItem.bind(listController)));
router.delete('/cartItem/:cartItemId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.removeFromCart.bind(listController)));
router.delete('/clearCart/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.clearCart.bind(listController)));
router.put('/cartItem/:cartItemId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.updateCartItem.bind(listController)));
router.post('/addToCart/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.addToCart.bind(listController)));

router.post('/addToReturnCart/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.addToReturnCart.bind(listController)));
router.get('/getReturnCartItems/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getReturnCartItems.bind(listController)));

router.get('/orderHistoryByProductNumber', 
    verifyRole(ROLES.SALES), verifySalesSession,
    catchAsync(listController.getOrderHistoryByProductNumber.bind(listController))
  );

  router.get('/orderPdf/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getPdfOfOrderDetails.bind(listController)));
  router.get('/orderDeliveryStatus/:id',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getOrderDeliveryStatus.bind(listController)));
  router.get('/deliveryCharge/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getDeliveryCharge.bind(listController)));
  router.get('/customerListPaginated',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getCustomerListAsPerSalesRep.bind(listController)));    
  router.get('/customerOrderedProducts/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getCustomerOrderedProducts.bind(listController)));
  router.get('/bannerList',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getBannerList.bind(listController)));
  router.get('/accountReceivablesList/:customerId',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.getAccountReceivablesList.bind(listController)));

  router.post('/removeMultipleItemsFromCart',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.removeMultipleItemsFromCart.bind(listController)));

  router.get('/scanItemByBarcode/:customerId',verifyRole(ROLES.SALES),catchAsync(listController.scanItemByBarcode.bind(listController)));
  router.post('/cart/addMultipleItems/:customerId',verifyRole(ROLES.SALES),catchAsync(listController.addMultipleItems.bind(listController)));
  router.get('/addToCartByScanner/:id',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.addToCartByScanner.bind(listController)));

  router.post('/multiScannerItems/:id',verifyRole(ROLES.SALES),verifySalesSession,catchAsync(listController.addToCartMultiScanner.bind(listController)));

  router.get('/customerByIdInfoInCalender/:customerId',verifyRole(ROLES.SALES),catchAsync(listController.getCustomerByIdInfoInCalender.bind(listController)));

  router.get('/customerCalenderList',verifyRole(ROLES.SALES),  catchAsync(listController.getCustomerCalenderList.bind(listController)));
  router.get('/getCustomerOrderByCalenderDate',verifyRole(ROLES.SALES),catchAsync(listController.getCustomerOrderByCalenderDate.bind(listController)));
  
  router.get('/getCustomerOrderOfCurrentWeek/:customerId',verifyRole(ROLES.SALES),catchAsync(listController.getCustomerOrderOfCurrentWeek.bind(listController)));

  router.get('/warehouseProfile',verifyRole(ROLES.SALES),catchAsync(listController.getWareHouseProfileDetails.bind(listController)));



  // policies
  router.get('/policies',verifyRole(ROLES.SALES),catchAsync(listController.getPolicies.bind(listController)));

  // SalesCallTime routes
  router.post('/sales-call-time',verifyRole(ROLES.SALES),validateRequest(createSalesCallTimeSchema),catchAsync(listController.createSalesCallTime.bind(listController)));
  router.put('/sales-call-time/:id',verifyRole(ROLES.SALES),validateRequest(updateSalesCallTimeSchema),catchAsync(listController.updateSalesCallTime.bind(listController)));

  // SalesNote CRUD routes
  router.post('/sales-notes',verifyRole(ROLES.SALES),validateRequest(createSalesNoteSchema),catchAsync(listController.createSalesNote.bind(listController)));
  router.get('/sales-notes/:customerId',verifyRole(ROLES.SALES),catchAsync(listController.getAllSalesNotes.bind(listController)));
  router.get('/sales-notes/:customerId/:salesId',verifyRole(ROLES.SALES),catchAsync(listController.getSalesNoteById.bind(listController)));
  router.put('/sales-notes/:id',verifyRole(ROLES.SALES),validateRequest(updateSalesNoteSchema),catchAsync(listController.updateSalesNote.bind(listController)));
  router.delete('/sales-notes/:salesId',verifyRole(ROLES.SALES),catchAsync(listController.deleteSalesNote.bind(listController)));
  router.get('/sales-notes-customer/:customerId',verifyRole(ROLES.SALES),catchAsync(listController.getSalesNotesByCustomer.bind(listController)));

  // OrderConfirmation CRUD routes
  router.get('/order-confirmation/details/:orderNumber',verifyRole(ROLES.SALES),catchAsync(listController.getOrderConfirmationDetailsHistory.bind(listController)));
  router.get('/order-confirmation/list',verifyRole(ROLES.SALES),catchAsync(listController.orderConfirmation.bind(listController)));
  router.post('/order-confirmation',verifyRole(ROLES.SALES),validateRequest(createOrderConfirmationSchema),catchAsync(listController.createOrderConfirmation.bind(listController)));
 
  router.put('/order-confirmation/:id',verifyRole(ROLES.SALES),catchAsync(listController.updateOrderConfirmation.bind(listController)));
  
  router.delete('/order-confirmation/:id',verifyRole(ROLES.SALES),catchAsync(listController.deleteOrderConfirmation.bind(listController)));

  router.get('/order-confirmation/sales/:salesId',verifyRole(ROLES.SALES),catchAsync(listController.getOrderConfirmationsBySalesId.bind(listController)));

 export default router;
