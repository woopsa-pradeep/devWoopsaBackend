import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { ManagerController } from '../controllers/manager.controller';
import verifyRole from '../middlewares/verifyUser.middleware';
import { ROLES } from '../interfaces/request.body.interface';
import { multerUpload } from '../middlewares/upload.middleware';
import { uploadProductImageSchema } from '../validations/test.validation';
import { validateRequest } from '../middlewares/validation.middleware';
import { createUserSchema, homeSettingsSchema, rolePermissionRequestSchema, roleUdatePermissionRequestSchema , updateWarehouseSettingSchema, createItemLimitSchema, updateItemLimitSchema, createNotificationSchedulerSchema, updateNotificationSchedulerSchema, getNotificationSchedulerSchema, createLinkSchema, updateLinkSchema, getLinksQuerySchema, createStorySchema, updateStorySchema, getStoriesQuerySchema, createWebViewSchema, updateWebViewSchema, getWebViewsQuerySchema, createRetailerRequestSchema, createPoliciesSchema, updatePoliciesSchema, updateRefundPoliciesSchema, createWebCategorySchema, updateWebCategorySchema, createWebQuickLinkSchema, updateWebQuickLinkSchema, createWebLocationSchema, updateWebLocationSchema, getWebLocationsQuerySchema, createContactUsSchema, updateContactUsSchema, getContactUsQuerySchema, createEmailConfigSchema, updateEmailConfigSchema, createEmailMarketingSchema, getEmailMarketingQuerySchema, createInventoryUPCSchema, updateInventoryUPCSchema, createEpickSettingSchema, getEpickSettingsQuerySchema, updateEpickSettingSchema, createInvoiceSettingSchema, updateInvoiceSettingSchema, createErpUserSchema, updateErpUserSchema, createDriverSchema, updateDriverSchema, updateDriverLocationSchema, getDriversQuerySchema, createDriverRouteAssignmentSchema, updateDriverRouteAssignmentSchema, getDriverRouteAssignmentsQuerySchema, createEpickUserSchema, updateEpickUserSchema, updateEpickUserPreferencesSchema, updateEpickUserCategoriesSchema, updateEpickUserItemSortSchema, createPicklistSchema, updatePicklistSchema, createFuturePricingSchema, updateFuturePricingSchema, getFuturePricingQuerySchema, createRetailerDocumentsSchema, updateRetailerDocumentsSchema, getRetailerDocumentsQuerySchema, createRetailerLocationSchema, updateRetailerLocationSchema, getRetailerLocationQuerySchema } from '../validations/manager.validation';
// import { createUserSchema, homeSettingsSchema, rolePermissionRequestSchema, roleUdatePermissionRequestSchema , updateWarehouseSettingSchema, createItemLimitSchema, updateItemLimitSchema, createNotificationSchedulerSchema, updateNotificationSchedulerSchema, getNotificationSchedulerSchema, createLinkSchema, updateLinkSchema, getLinksQuerySchema, createStorySchema, updateStorySchema, getStoriesQuerySchema, createWebViewSchema, updateWebViewSchema, getWebViewsQuerySchema, createRetailerRequestSchema, createPoliciesSchema, updatePoliciesSchema, updateRefundPoliciesSchema, createWebCategorySchema, updateWebCategorySchema, createWebQuickLinkSchema, updateWebQuickLinkSchema, createWebLocationSchema, updateWebLocationSchema, getWebLocationsQuerySchema, createContactUsSchema, updateContactUsSchema, getContactUsQuerySchema, createEmailConfigSchema, updateEmailConfigSchema, createEmailMarketingSchema, getEmailMarketingQuerySchema, createInventoryUPCSchema, updateInventoryUPCSchema, createEpickSettingSchema, getEpickSettingsQuerySchema, updateEpickSettingSchema, createErpUserSchema, updateErpUserSchema, createPOHeaderSchema } from '../validations/manager.validation';
import { itemGlobalSchema, retailerSchema, salesRepSchema, warehouseProfileSchema } from '../validations/setting.validation';
import { createRetailerProductCatalogSchema, updateRetailerProductCatalogSchema } from '../validations/retailer.validation';
import { createInventoryItemGroupSchema, updateInventoryItemGroupSchema } from '../validations/manager.validation';
import { createInventoryBrandSchema, updateInventoryBrandSchema,updateDistributorSchema,updatePriceClassSchema } from '../validations/manager.validation';


const router = Router();
 const managerController = new ManagerController();

 router.get('/profile',verifyRole(ROLES.MANAGER,ROLES.SALES),catchAsync(managerController.getProfile.bind(managerController)));
 router.put('/loginDevice/:id',verifyRole(ROLES.MANAGER,ROLES.SALES),catchAsync(managerController.updateRetailerLoginDevice.bind(managerController)));
 router.get('/loginDevice',verifyRole(ROLES.MANAGER,ROLES.SALES),catchAsync(managerController.getRetailerLoginDevice.bind(managerController)));
 router.get('/customerList',verifyRole(ROLES.MANAGER,ROLES.SALES),catchAsync(managerController.getCustomerList.bind(managerController)));
 router.post('/productList',verifyRole(ROLES.MANAGER,ROLES.SALES),catchAsync(managerController.getProductList.bind(managerController)));
 router.post('/uploadProductImage',verifyRole(ROLES.MANAGER,ROLES.SALES),multerUpload.single('image'),validateRequest(uploadProductImageSchema),catchAsync(managerController.uploadProductImage.bind(managerController)));
 router.put('/updateProductImage/:id',verifyRole(ROLES.MANAGER,ROLES.SALES),multerUpload.single('image'),validateRequest(uploadProductImageSchema),catchAsync(managerController.updateProductImage.bind(managerController)));
 router.post('/createBanner',verifyRole(ROLES.MANAGER,ROLES.SALES),multerUpload.single('image_url'),catchAsync(managerController.createBanner.bind(managerController)));
 router.put('/updateBanner/:id',verifyRole(ROLES.MANAGER,ROLES.SALES),multerUpload.single('image_url'),catchAsync(managerController.updateBanner.bind(managerController)));
 router.get('/getBannerList',verifyRole(ROLES.MANAGER,ROLES.SALES),catchAsync(managerController.getBannerList.bind(managerController)));
 router.delete('/deleteBanner/:id',verifyRole(ROLES.MANAGER,ROLES.SALES),catchAsync(managerController.deleteBanner.bind(managerController)));
 router.get('/vendorList', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getVendorList.bind(managerController)));
 router.get('/accountReceivables', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAccountReceivablesList.bind(managerController)));
router.get('/product/:itemNumber', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getProductById.bind(managerController)));
router.get('/retailerSignUp', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getRetailerSignUp.bind(managerController)));
router.put('/updateRetailerSignUp/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateRetailerSignUp.bind(managerController)));

router.get('/userList', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getUserList.bind(managerController)));
router.post('/createUser', verifyRole(ROLES.MANAGER,ROLES.SALES),validateRequest(createUserSchema), catchAsync(managerController.createUser.bind(managerController)));
router.post('/createEpickUser', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createEpickUserSchema), catchAsync(managerController.createEpickUser.bind(managerController)));
router.put('/updateUser/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateUser.bind(managerController)));
router.put('/updateEpickUser/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateEpickUser.bind(managerController)));
router.delete('/deleteUser/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteUser.bind(managerController)));
router.get('/epickUsers', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getEpickUserDetails.bind(managerController)));
router.put('/epickUsers/:userId/preferences', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateEpickUserPreferencesSchema), catchAsync(managerController.updateEpickUserPreferences.bind(managerController)));
router.put('/epickUsers/:userId/categories', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateEpickUserCategoriesSchema), catchAsync(managerController.updateEpickUserCategories.bind(managerController)));
router.put('/epickUsers/:userId/itemSort', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateEpickUserItemSortSchema), catchAsync(managerController.updateEpickUserItemSort.bind(managerController)));
router.get('/epickReports', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getEpickReports.bind(managerController)));
router.delete('/deleteEpickUser/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteEpickUser.bind(managerController)));
router.post('/createRolePermissions', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(rolePermissionRequestSchema), catchAsync(managerController.createRolePermissions.bind(managerController)));
router.put('/updateRolePermissions', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(roleUdatePermissionRequestSchema), catchAsync(managerController.updateRolePermissions.bind(managerController)));
router.get('/getUserRolePermissions/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getUserRolePermissions.bind(managerController)));
router.post('/uploadWarehouseImage',verifyRole(ROLES.MANAGER,ROLES.SALES),multerUpload.single('image'),catchAsync(managerController.uploadWarehouseImage.bind(managerController)));
router.get('/summary',verifyRole(ROLES.MANAGER,ROLES.SALES),catchAsync(managerController.getAccountReceivableTotals.bind(managerController)));
router.get('/warehouseContactDetails', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getWarehouseContactDetails.bind(managerController)));
router.get('/orderHistory', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getOrderHistory.bind(managerController)));
router.get('/orderHistoryByOrderNumber/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getOrderHistoryByOrderNumber.bind(managerController)));
router.get('/orderDetailByOrderNumberForInvoice/:id',verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getOrderDetailByOrderNumberForInvoice.bind(managerController)));






router.get('/homeSetting', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getHomeSetting.bind(managerController)));
router.put('/updateHomeSetting', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(homeSettingsSchema), catchAsync(managerController.updateHomeSetting.bind(managerController)));
router.post('/getProductInformation', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getProductInformation.bind(managerController)));
router.get('/orderDeliveryStatus/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getOrderDeliveryStatus.bind(managerController)));
router.put('/settings/email' , catchAsync(managerController.updateEmailNotification.bind(managerController)));


//settings
router.get('/warehouseSetting', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getWarehouseSetting.bind(managerController)));
router.put('/updateSalesRepSetting', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(salesRepSchema), catchAsync(managerController.updateSalesRepSetting.bind(managerController)));
router.put('/updateRetailerSetting', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(retailerSchema), catchAsync(managerController.updateRetailerSetting.bind(managerController)));
router.put('/updateItemGlobalSetting', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(itemGlobalSchema), catchAsync(managerController.updateItemGlobalSetting.bind(managerController)));
router.put('/updateWarehouseProfileSetting', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(warehouseProfileSchema), catchAsync(managerController.updateWarehouseProfileSetting.bind(managerController)));

// ItemLimit CRUD routes
router.post('/itemLimits', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createItemLimitSchema), catchAsync(managerController.createItemLimit.bind(managerController)));
router.get('/itemLimits', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllItemLimits.bind(managerController)));
router.get('/itemLimits/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getItemLimitById.bind(managerController)));
router.get('/itemLimits/itemNumber/:itemNumber', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getItemLimitByItemNumber.bind(managerController)));
router.put('/itemLimits/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateItemLimitSchema), catchAsync(managerController.updateItemLimit.bind(managerController)));
router.delete('/itemLimits/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteItemLimit.bind(managerController)));

// NotificationScheduler CRUD routes
router.post('/notificationSchedulers', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createNotificationSchedulerSchema), catchAsync(managerController.createNotificationScheduler.bind(managerController)));
router.get('/notificationSchedulers', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(getNotificationSchedulerSchema), catchAsync(managerController.getAllNotificationSchedulers.bind(managerController)));
router.get('/notificationSchedulers/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getNotificationSchedulerById.bind(managerController)));
router.put('/notificationSchedulers/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateNotificationSchedulerSchema), catchAsync(managerController.updateNotificationScheduler.bind(managerController)));
router.delete('/notificationSchedulers/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteNotificationScheduler.bind(managerController)));
router.get('/notificationSchedulers/user/:userId', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getNotificationSchedulersByUser.bind(managerController)));
router.patch('/notificationSchedulers/:id/toggle', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.toggleNotificationSchedulerStatus.bind(managerController)));


// support ticket
router.get('/supportTicket/:status', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getSupportTicket.bind(managerController)));
router.put('/supportTicket/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateSupportTicket.bind(managerController)));

router.put('/setCustomerLimit/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.setCustomerLimit.bind(managerController)));

router.put('/updateRetailer/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateRetailer.bind(managerController)));
// Link CRUD routes
router.post('/links', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('logo'), validateRequest(createLinkSchema), catchAsync(managerController.createLink.bind(managerController)));
router.get('/links', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllLinks.bind(managerController)));
router.get('/links/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getLinkById.bind(managerController)));
router.put('/links/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('logo'), catchAsync(managerController.updateLink.bind(managerController)));
router.delete('/links/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteLink.bind(managerController)));
router.patch('/links/:id/toggle', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.toggleLinkStatus.bind(managerController)));

// Story CRUD routes
router.post('/stories', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('media'), validateRequest(createStorySchema), catchAsync(managerController.createStory.bind(managerController)));
router.get('/stories', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllStories.bind(managerController)));
router.get('/stories/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getStoryById.bind(managerController)));
router.put('/stories/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('media'), validateRequest(updateStorySchema), catchAsync(managerController.updateStory.bind(managerController)));
router.delete('/stories/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteStory.bind(managerController)));
router.patch('/stories/:id/toggle', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.toggleStoryStatus.bind(managerController)));


// RetailerProductCatalog CRUD routes
router.post('/product-catalogs', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('attachment'), validateRequest(createRetailerProductCatalogSchema), catchAsync(managerController.createRetailerProductCatalog.bind(managerController)));
router.get('/product-catalogs', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllRetailerProductCatalogs.bind(managerController)));
router.put('/product-catalogs/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateRetailerProductCatalogSchema), catchAsync(managerController.updateRetailerProductCatalog.bind(managerController)));
router.delete('/product-catalogs/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteRetailerProductCatalog.bind(managerController)));

// WebView CRUD routes
router.post('/webviews', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('image'), validateRequest(createWebViewSchema), catchAsync(managerController.createWebView.bind(managerController)));
router.get('/webviews', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllWebViews.bind(managerController)));
router.get('/webviews/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getWebViewById.bind(managerController)));
router.put('/webviews/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('image'), validateRequest(updateWebViewSchema), catchAsync(managerController.updateWebView.bind(managerController)));
router.delete('/webviews/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteWebView.bind(managerController)));
router.get('/webviews/section/:section', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getWebViewsBySection.bind(managerController)));
router.get('/webviews/grouped', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getWebViewsGroupedBySection.bind(managerController)));
router.get('/webviews/grouped/all', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllWebViewsGrouped.bind(managerController)));
router.post('/webviews/products-update/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateWebViewProducts.bind(managerController)));

// Retailer Request CRUD routes
router.post('/retailer-requests', 
  verifyRole(ROLES.MANAGER,ROLES.SALES), 
  multerUpload.fields([
    { name: 'resale_certificate_url', maxCount: 1 },
    { name: 'state_tobacco_license_url', maxCount: 1 },
    { name: 'business_license_url', maxCount: 1 },
    { name: 'owner_government_id_url', maxCount: 1 }
  ]),
  validateRequest(createRetailerRequestSchema), 
  catchAsync(managerController.createRetailerRequest.bind(managerController))
);
router.get('/retailer-requests', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllRetailerRequests.bind(managerController)));
router.get('/retailer-requests/:id', verifyRole(ROLES.MANAGER,ROLES.SALES),  catchAsync(managerController.getRetailerRequestById.bind(managerController)));
router.put('/retailer-requests/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateRetailerRequest.bind(managerController)));
router.delete('/retailer-requests/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteRetailerRequest.bind(managerController)));

// Policies CRUD routes
router.post('/policies', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createPoliciesSchema), catchAsync(managerController.createPolicies.bind(managerController)));
router.get('/policies', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getPolicies.bind(managerController)));
router.put('/policies', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updatePoliciesSchema), catchAsync(managerController.updatePolicies.bind(managerController)));
router.put('/policies/refund', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateRefundPoliciesSchema), catchAsync(managerController.updateRefundPolicies.bind(managerController)));
router.delete('/policies', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deletePolicies.bind(managerController)));

// WebCategory CRUD routes
router.post('/web-categories', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.createWebCategory.bind(managerController)));
router.get('/web-categories', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllWebCategories.bind(managerController)));
router.get('/web-categories/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getWebCategoryById.bind(managerController)));
router.put('/web-categories/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.updateWebCategory.bind(managerController)));
router.delete('/web-categories/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteWebCategory.bind(managerController)));

// WebPriceClass CRUD routes
router.post('/web-price-classes', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('image'),  catchAsync(managerController.createWebPriceClass.bind(managerController)));
router.get('/web-price-classes', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllWebPriceClasses.bind(managerController)));
router.get('/web-price-classes/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getWebPriceClassById.bind(managerController)));
router.put('/web-price-classes/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.updateWebPriceClass.bind(managerController)));
router.delete('/web-price-classes/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteWebPriceClass.bind(managerController)));

// WebQuickLink CRUD routes
router.post('/web-quick-links', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createWebQuickLinkSchema), catchAsync(managerController.createWebQuickLink.bind(managerController)));
router.get('/web-quick-links', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllWebQuickLinks.bind(managerController)));
router.get('/web-quick-links/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getWebQuickLinkById.bind(managerController)));
router.put('/web-quick-links/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('image'), validateRequest(updateWebQuickLinkSchema), catchAsync(managerController.updateWebQuickLink.bind(managerController)));
router.delete('/web-quick-links/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteWebQuickLink.bind(managerController)));

// WebLocation CRUD routes
router.post('/web-locations', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createWebLocationSchema), catchAsync(managerController.createWebLocation.bind(managerController)));
router.get('/web-locations', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllWebLocations.bind(managerController)));
router.get('/web-locations/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getWebLocationById.bind(managerController)));
router.put('/web-locations/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateWebLocationSchema), catchAsync(managerController.updateWebLocation.bind(managerController)));
router.delete('/web-locations/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteWebLocation.bind(managerController)));
router.put('/setUserLimits/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.setUserDiscountLimit.bind(managerController)));
router.post('/customerCalenderList', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getCustomerCalenderList.bind(managerController)));
router.get('/getCustomerOrderByCalenderDate', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getCustomerOrderByCalenderDate.bind(managerController)));
router.get('/getCustomerTotalOrderByCustomer', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getCustomerTotalOrderByCustomer.bind(managerController)));
router.get('/customerOrderOfCurrentWeek/:customerId', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getCustomerOrderOfCurrentWeek.bind(managerController)));
router.get('/customerByIdInfoInCalender/:customerId', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getCustomerByIdInfoInCalender.bind(managerController)));

// ContactUs CRUD routes
router.post('/contact-us',verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createContactUsSchema), catchAsync(managerController.createContactUs.bind(managerController)));
router.get('/contact-us', verifyRole(ROLES.MANAGER,ROLES.SALES),validateRequest(getContactUsQuerySchema), catchAsync(managerController.getAllContactUs.bind(managerController)));
router.put('/contact-us/:id',verifyRole(ROLES.MANAGER,ROLES.SALES) , catchAsync(managerController.updateContactUs.bind(managerController)));
router.delete('/contact-us/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteContactUs.bind(managerController)));
router.get('/generateBarcodeAndUpload',  catchAsync(managerController.getGenerateBarcodeAndUpload.bind(managerController)));

// Email Management CRUD routes
router.post('/email-configs', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createEmailConfigSchema), catchAsync(managerController.createEmailConfig.bind(managerController)));
router.get('/email-configs', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllEmailConfigs.bind(managerController)));
router.get('/email-configs/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getEmailConfigById.bind(managerController)));
router.put('/email-configs/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateEmailConfigSchema), catchAsync(managerController.updateEmailConfig.bind(managerController)));
router.delete('/email-configs/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteEmailConfig.bind(managerController)));
router.get('/email-configs/user/:userId', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getEmailConfigsByUser.bind(managerController)));
router.patch('/email-configs/:id/toggle', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.toggleEmailConfigStatus.bind(managerController)));
router.post('/email-configs/test', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.testEmailConfig.bind(managerController)));

// Email Marketing CRUD routes
router.post('/email-marketingv1', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createEmailMarketingSchema), catchAsync(managerController.createEmailMarketing.bind(managerController)));

router.post('/email-marketing', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createEmailMarketingSchema), catchAsync(managerController.createEmailMarketing.bind(managerController)));
router.get('/email-marketing', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(getEmailMarketingQuerySchema), catchAsync(managerController.getAllEmailMarketing.bind(managerController)));
router.get('/email-marketing/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getEmailMarketingById.bind(managerController)));
router.get('/email-marketing/user/:userId', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getEmailMarketingByUser.bind(managerController)));

router.post('/uploadAttachment', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('attachment'), catchAsync(managerController.uploadAttachment.bind(managerController)));
router.post('/email-marketing/:id/send', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.sendEmailToCampaign.bind(managerController)));

// Inventory CRUD routes
router.post('/create-inventory',verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.createInventory.bind(managerController)));
router.put('/edit-inventory/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.editInventory.bind(managerController)));
router.put('/edit-upc-number/:key', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.editUpcNumber.bind(managerController)));

//vendor CRUD routes
router.post('/create-vendor', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.createVendor.bind(managerController)));
router.put('/updateVendor/:id', verifyRole(ROLES.MANAGER,ROLES.SALES),  catchAsync(managerController.updateVendor.bind(managerController)));
router.get('/vendor/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getVendorById.bind(managerController)));
router.get('/customer/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getCustomerDetailsById.bind(managerController)));

//ERPUser CRUD routes
router.post('/createErpUser' ,validateRequest(createErpUserSchema),catchAsync(managerController.createErpUser.bind(managerController)));
router.get('/erp-users' , verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllErpUsers.bind(managerController)))
router.get('/erpuser/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getErpUserById.bind(managerController)))
router.put('/updateErpUser/:id', validateRequest(updateErpUserSchema),catchAsync(managerController.updateErpUser.bind(managerController)));

//Checker Users routes
router.get('/checker-users', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllCheckerUsers.bind(managerController)));

// InventoryUPC CRUD routes
router.post('/inventory-upc', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createInventoryUPCSchema), catchAsync(managerController.createInventoryUPC.bind(managerController)));
router.get('/inventory-upc/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getInventoryUPCById.bind(managerController)));
router.get('/inventoryForReport',  verifyRole(ROLES.MANAGER,ROLES.SALES),catchAsync(managerController.getInventoryForReport.bind(managerController)));
router.get('/customerForReport',  verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getCustomerForReport.bind(managerController)));


router.post('/inventoryItemsForUpdate', catchAsync(managerController.getInventoryItemsForUpdate.bind(managerController)));
router.post('/bulkUpdateInventory', catchAsync(managerController.bulkUpdateInventory.bind(managerController)));








router.get('/inventory/:itemNumber', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getInventoryByItemNumber.bind(managerController)));
router.get('/inventoryForReport',  catchAsync(managerController.getInventoryForReport.bind(managerController)));
router.put('/inventory-upc/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateInventoryUPCSchema), catchAsync(managerController.updateInventoryUPC.bind(managerController)));
router.delete('/inventory-upc/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteInventoryUPC.bind(managerController)));
router.get('/inventory-upc/item-number/:itemNumber', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getInventoryUPCByItemNumber.bind(managerController)));
router.get('/inventory-upc/jurisdiction', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getInventoryUPCByJurisdiction.bind(managerController)));
router.get('/check-upc/:upc', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.checkUPCExists.bind(managerController)));
// EpickSetting CRUD routes
router.post('/epick-settings', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createEpickSettingSchema), catchAsync(managerController.createEpickSetting.bind(managerController)));
router.get('/epick-settings', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(getEpickSettingsQuerySchema), catchAsync(managerController.getAllEpickSettings.bind(managerController)));
router.get('/epick-settings/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getEpickSettingById.bind(managerController)));
router.put('/epick-settings/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateEpickSettingSchema), catchAsync(managerController.updateEpickSetting.bind(managerController)));
router.delete('/epick-settings/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteEpickSetting.bind(managerController)));
// InvoiceSetting CRUD routes (create & update)
router.post('/invoice-setting', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createInvoiceSettingSchema), catchAsync(managerController.createInvoiceSetting.bind(managerController)));
router.put('/invoice-setting/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateInvoiceSettingSchema), catchAsync(managerController.updateInvoiceSetting.bind(managerController)));
// router.post('/pass-scan-items', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.putPassScanItem.bind(managerController)));
router.post('/createCustomer', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.createCustomer.bind(managerController)));
router.put('/updateUserAllowDiscount/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateUserAllowDiscount.bind(managerController)));

// PO Header routes
router.post('/po-order', verifyRole(ROLES.MANAGER,ROLES.SALES),  catchAsync(managerController.createPurchaseOrder.bind(managerController)));

// Override Request routes (Distributor)
import { EpickController } from '../controllers/epick.controller';
const epickController = new EpickController();
router.get('/pendingOverrideRequests', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(epickController.getPendingOverrideRequests.bind(epickController)));
router.get('/pendingOverrideRequests/:orderNumber', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(epickController.getPendingOverrideRequestsByOrder.bind(epickController)));
router.get('/approvedOverrideRequests', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(epickController.getApprovedOverrideRequests.bind(epickController)));
router.get('/cancelledOverrideRequests', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(epickController.getCancelledOverrideRequests.bind(epickController)));
router.post('/approveOverrideRequest/:requestId', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(epickController.approveOverrideRequest.bind(epickController)));
router.post('/cancelOverrideRequest/:requestId', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(epickController.cancelOverrideRequestByDistributor.bind(epickController)));

// Ongoing Orders routes (Distributor/Admin)
router.get('/ongoingOrders', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(epickController.getOngoingOrders.bind(epickController)));
router.delete('/ongoingOrders/:orderNumber', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(epickController.removeOngoingOrder.bind(epickController)));
router.put('/updateCustomer/:id' , verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateCustomer.bind(managerController)));

// Driver CRUD routes
router.post('/drivers', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createDriverSchema), catchAsync(managerController.createDriver.bind(managerController)));
router.get('/drivers', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(getDriversQuerySchema), catchAsync(managerController.getAllDrivers.bind(managerController)));
router.get('/drivers/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getDriverById.bind(managerController)));
router.put('/drivers/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateDriverSchema), catchAsync(managerController.updateDriver.bind(managerController)));
router.delete('/drivers/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteDriver.bind(managerController)));
router.put('/drivers/:id/location', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateDriverLocationSchema), catchAsync(managerController.updateDriverLocation.bind(managerController)));

// DriverRouteAssignment CRUD routes
router.post('/driver-route-assignments', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createDriverRouteAssignmentSchema), catchAsync(managerController.createDriverRouteAssignment.bind(managerController)));
router.get('/driver-route-assignments', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(getDriverRouteAssignmentsQuerySchema), catchAsync(managerController.getAllDriverRouteAssignments.bind(managerController)));
router.get('/driver-route-assignments/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getDriverRouteAssignmentById.bind(managerController)));
router.put('/driver-route-assignments/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateDriverRouteAssignmentSchema), catchAsync(managerController.updateDriverRouteAssignment.bind(managerController)));
router.delete('/driver-route-assignments/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteDriverRouteAssignment.bind(managerController)));
router.get('/drivers/:driverId/route-assignments', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getDriverRouteAssignmentsByDriver.bind(managerController)));

// Order Numbers routes
router.get('/order-numbers', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllOrderNumbers.bind(managerController)));

// Distributor Update routes
router.put('/distributorUpdate', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateDistributorSchema),catchAsync(managerController.distributorUpdate.bind(managerController)));
// Picklist CRUD routes
router.post('/picklists', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createPicklistSchema), catchAsync(managerController.createPicklist.bind(managerController)));
router.get('/picklists', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllPicklists.bind(managerController)));
router.get('/picklists/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getPicklistById.bind(managerController)));
router.put('/picklists/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updatePicklistSchema), catchAsync(managerController.updatePicklist.bind(managerController)));
router.delete('/picklists/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deletePicklist.bind(managerController)));
router.put('/makePickListPrinted/:orderNumber', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.makePickListPrinted.bind(managerController)));

// FuturePricing CRUD routes
router.post('/future-pricing', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createFuturePricingSchema), catchAsync(managerController.createFuturePricing.bind(managerController)));
router.get('/future-pricing', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getAllFuturePricings.bind(managerController)));
router.get('/future-pricing/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getFuturePricingById.bind(managerController)));
router.put('/future-pricing/:id', verifyRole(ROLES.MANAGER,ROLES.SALES),  catchAsync(managerController.updateFuturePricing.bind(managerController)));
router.delete('/future-pricing/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteFuturePricing.bind(managerController)));

// Inventory_ItemGroups CRUD routes
router.get('/getInventoryItemGroups', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getInventoryItemGroups.bind(managerController)));
router.post('/inventory-item-groups', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createInventoryItemGroupSchema), catchAsync(managerController.createInventoryItemGroup.bind(managerController)));
router.put('/inventory-item-groups/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateInventoryItemGroupSchema), catchAsync(managerController.updateInventoryItemGroup.bind(managerController)));

//Inventory_Brands  CRUD routes
router.get('/getinventory-brands', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getinventorybrands.bind(managerController)));
router.post('/inventory-brands', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createInventoryBrandSchema), catchAsync(managerController.createInventoryBrand.bind(managerController)));
router.put('/inventory-brands/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateInventoryBrandSchema), catchAsync(managerController.updateInventoryBrand.bind(managerController)));

// Images routes
router.post('/uploadImages', verifyRole(ROLES.MANAGER,ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.uploadImages.bind(managerController)));

//Price Class update route
router.get('/getPriceClass', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getPriceClass.bind(managerController)));
router.put('/updatePriceClass/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updatePriceClassSchema), catchAsync(managerController.updatePriceClass.bind(managerController)));

// Loss Quantity
// router.get('/lossQuantityReport', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getLossQuantityReport.bind(managerController)));

// RetailerDocuments CRUD routes
router.post('/retailer-documents', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createRetailerDocumentsSchema), catchAsync(managerController.createRetailerDocuments.bind(managerController)));
router.get('/retailer-documents', verifyRole(ROLES.MANAGER,ROLES.SALES),  catchAsync(managerController.getAllRetailerDocuments.bind(managerController)));
router.get('/retailer-documents/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getRetailerDocumentsById.bind(managerController)));
router.put('/retailer-documents/:id', verifyRole(ROLES.MANAGER,ROLES.SALES),  catchAsync(managerController.updateRetailerDocuments.bind(managerController)));
router.delete('/retailer-documents/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteRetailerDocuments.bind(managerController)));

// RetailerLocation CRUD routes
router.post('/retailer-location', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createRetailerLocationSchema), catchAsync(managerController.createRetailerLocation.bind(managerController)));
router.get('/retailer-location', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(getRetailerLocationQuerySchema), catchAsync(managerController.getAllRetailerLocations.bind(managerController)));
router.get('/retailer-location/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getRetailerLocationById.bind(managerController)));
router.put('/retailer-location/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(updateRetailerLocationSchema), catchAsync(managerController.updateRetailerLocation.bind(managerController)));
router.delete('/retailer-location/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteRetailerLocation.bind(managerController)));

// Velocity Report - Customer Group route
// router.get('/velocityReportCustomerGroup', verifyRole(ROLES.MANAGER), catchAsync(managerController.getVelocityReportCustomerGroup.bind(managerController)));

router.get('/getShortShipmentReport', verifyRole(ROLES.MANAGER), catchAsync(managerController.getShortShipmentReport.bind(managerController)));
router.get('/getVelocityReportCustomer', verifyRole(ROLES.MANAGER), catchAsync(managerController.getVelocityReportCustomer.bind(managerController)));

export default router; 
