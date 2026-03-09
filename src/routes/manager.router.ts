import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { ManagerController } from '../controllers/manager.controller';
import verifyRole from '../middlewares/verifyUser.middleware';
import { ROLES } from '../interfaces/request.body.interface';
import { multerUpload } from '../middlewares/upload.middleware';
import { uploadProductImageSchema } from '../validations/test.validation';
import { validateRequest } from '../middlewares/validation.middleware';
import { createUserSchema, homeSettingsSchema, rolePermissionRequestSchema, roleUdatePermissionRequestSchema, updateWarehouseSettingSchema, createItemLimitSchema, updateItemLimitSchema, createNotificationSchedulerSchema, updateNotificationSchedulerSchema, getNotificationSchedulerSchema, createLinkSchema, updateLinkSchema, getLinksQuerySchema, createStorySchema, updateStorySchema, getStoriesQuerySchema, createWebViewSchema, updateWebViewSchema, getWebViewsQuerySchema, createRetailerRequestSchema, createPoliciesSchema, updatePoliciesSchema, updateRefundPoliciesSchema, createWebCategorySchema, updateWebCategorySchema, createWebQuickLinkSchema, updateWebQuickLinkSchema, createWebLocationSchema, updateWebLocationSchema, getWebLocationsQuerySchema, createContactUsSchema, updateContactUsSchema, getContactUsQuerySchema, createEmailConfigSchema, updateEmailConfigSchema, createEmailMarketingSchema, getEmailMarketingQuerySchema, createInventoryUPCSchema, updateInventoryUPCSchema, createEpickSettingSchema, getEpickSettingsQuerySchema, updateEpickSettingSchema, createInvoiceSettingSchema, updateInvoiceSettingSchema, createErpUserSchema, updateErpUserSchema, createDriverSchema, updateDriverSchema, updateDriverLocationSchema, getDriversQuerySchema, createDriverRouteAssignmentSchema, updateDriverRouteAssignmentSchema, getDriverRouteAssignmentsQuerySchema, createEpickUserSchema, updateEpickUserSchema, updateEpickUserPreferencesSchema, updateEpickUserCategoriesSchema, updateEpickUserItemSortSchema, createPicklistSchema, updatePicklistSchema, createFuturePricingSchema, updateFuturePricingSchema, getFuturePricingQuerySchema, createRetailerDocumentsSchema, updateRetailerDocumentsSchema, getRetailerDocumentsQuerySchema, createRetailerLocationSchema, updateRetailerLocationSchema, getRetailerLocationQuerySchema, createPreBookSchema, updatePreBookSchema, getPreBooksQuerySchema, createTradeShowSchema, updateTradeShowSchema, getTradeShowsQuerySchema, createTradeShowItemSchema, updateTradeShowItemSchema, getTradeShowItemsQuerySchema, createBulkTradeShowItemsSchema, updateBulkTradeShowItemsSchema, createTradeShowRetailerSchema, updateTradeShowRetailerSchema, getTradeShowRetailersQuerySchema, createBulkTradeShowRetailersSchema, createTradeShowVendorSchema, updateTradeShowVendorSchema, getTradeShowVendorsQuerySchema, createBulkTradeShowVendorsSchema, createTradeShowDeliveryProductSchema, updateTradeShowDeliveryProductSchema, getTradeShowDeliveryProductsQuerySchema, createBulkTradeShowDeliveryProductsSchema, createEmailModuleSchema, updateEmailModuleSchema, getEmailModulesQuerySchema, createEmailModuleConfigSchema, updateEmailModuleConfigSchema, getEmailModuleConfigsQuerySchema, createCustomerAssignInvoiceTemplateSchema, updateCustomerAssignInvoiceTemplateSchema, getCustomerAssignInvoiceTemplatesQuerySchema, bulkAddCustomerAssignInvoiceTemplatesSchema, bulkRemoveCustomerAssignInvoiceTemplatesSchema, createInvoiceTemplateSchema, updateInvoiceTemplateSchema, getInvoiceTemplatesQuerySchema, createDeliveryRouteSchema, createVehicleSchema, getVehiclesQuerySchema, updateVehicleSchema, bulkUploadItemImagesSchema, createProductDiscountSchema, updateProductDiscountSchema, getProductDiscountsQuerySchema } from '../validations/manager.validation';
// import { createUserSchema, homeSettingsSchema, rolePermissionRequestSchema, roleUdatePermissionRequestSchema , updateWarehouseSettingSchema, createItemLimitSchema, updateItemLimitSchema, createNotificationSchedulerSchema, updateNotificationSchedulerSchema, getNotificationSchedulerSchema, createLinkSchema, updateLinkSchema, getLinksQuerySchema, createStorySchema, updateStorySchema, getStoriesQuerySchema, createWebViewSchema, updateWebViewSchema, getWebViewsQuerySchema, createRetailerRequestSchema, createPoliciesSchema, updatePoliciesSchema, updateRefundPoliciesSchema, createWebCategorySchema, updateWebCategorySchema, createWebQuickLinkSchema, updateWebQuickLinkSchema, createWebLocationSchema, updateWebLocationSchema, getWebLocationsQuerySchema, createContactUsSchema, updateContactUsSchema, getContactUsQuerySchema, createEmailConfigSchema, updateEmailConfigSchema, createEmailMarketingSchema, getEmailMarketingQuerySchema, createInventoryUPCSchema, updateInventoryUPCSchema, createEpickSettingSchema, getEpickSettingsQuerySchema, updateEpickSettingSchema, createErpUserSchema, updateErpUserSchema, createPOHeaderSchema } from '../validations/manager.validation';
import { itemGlobalSchema, retailerSchema, salesRepSchema, warehouseProfileSchema } from '../validations/setting.validation';
import { createRetailerProductCatalogSchema, updateRetailerProductCatalogSchema } from '../validations/retailer.validation';
import { createInventoryItemGroupSchema, updateInventoryItemGroupSchema } from '../validations/manager.validation';
import { createInventoryBrandSchema, updateInventoryBrandSchema, updateDistributorSchema, updatePriceClassSchema } from '../validations/manager.validation';


const router = Router();
const managerController = new ManagerController();

router.get('/profile', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getProfile.bind(managerController)));
router.put('/loginDevice/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateRetailerLoginDevice.bind(managerController)));
router.get('/loginDevice', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getRetailerLoginDevice.bind(managerController)));
router.get('/customerList', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerList.bind(managerController)));
router.post('/productList', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getProductList.bind(managerController)));
router.post('/productListWithTax', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getProductListWithTax.bind(managerController)));
router.post('/uploadProductImage', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), validateRequest(uploadProductImageSchema), catchAsync(managerController.uploadProductImage.bind(managerController)));
router.put('/updateProductImage/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), validateRequest(uploadProductImageSchema), catchAsync(managerController.updateProductImage.bind(managerController)));
router.post('/createBanner', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image_url'), catchAsync(managerController.createBanner.bind(managerController)));
router.put('/updateBanner/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image_url'), catchAsync(managerController.updateBanner.bind(managerController)));
router.get('/getBannerList', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getBannerList.bind(managerController)));
router.delete('/deleteBanner/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteBanner.bind(managerController)));
router.get('/vendorList', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getVendorList.bind(managerController)));
router.get('/accountReceivables', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAccountReceivablesList.bind(managerController)));
router.get('/product/:itemNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getProductById.bind(managerController)));
router.get('/retailerSignUp', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getRetailerSignUp.bind(managerController)));
router.put('/updateRetailerSignUp/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateRetailerSignUp.bind(managerController)));

router.get('/userList', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getUserList.bind(managerController)));
router.post('/createUser', verifyRole(ROLES.MANAGER,ROLES.SALES),validateRequest(createUserSchema), catchAsync(managerController.createUser.bind(managerController)));
router.post('/createEpickUser', verifyRole(ROLES.MANAGER,ROLES.SALES), validateRequest(createEpickUserSchema), catchAsync(managerController.createEpickUser.bind(managerController)));
router.put('/updateUser/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateUser.bind(managerController)));
router.put('/updateEpickUser/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.updateEpickUser.bind(managerController)));
router.delete('/deleteUser/:id', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.deleteUser.bind(managerController)));
router.get('/epickUsers', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getEpickUserDetails.bind(managerController)));
router.get('/pickRightAreasForEpick', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getPickRightAreasForEpick.bind(managerController)));
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


router.get('/orderForPickListConfirmation', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getOrderForPickListConfirmation.bind(managerController)));
router.get('/orderHistoryByOrderNumber/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getOrderHistoryByOrderNumber.bind(managerController)));
router.get('/orderDetailByOrderNumberForInvoice/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getOrderDetailByOrderNumberForInvoice.bind(managerController)));






router.get('/homeSetting', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getHomeSetting.bind(managerController)));
router.put('/updateHomeSetting', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(homeSettingsSchema), catchAsync(managerController.updateHomeSetting.bind(managerController)));
router.post('/getProductInformation', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getProductInformation.bind(managerController)));
router.get('/orderDeliveryStatus/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getOrderDeliveryStatus.bind(managerController)));
router.put('/settings/email', catchAsync(managerController.updateEmailNotification.bind(managerController)));


//settings
router.get('/warehouseSetting', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getWarehouseSetting.bind(managerController)));
router.put('/updateSalesRepSetting', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(salesRepSchema), catchAsync(managerController.updateSalesRepSetting.bind(managerController)));
router.put('/updateRetailerSetting', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(retailerSchema), catchAsync(managerController.updateRetailerSetting.bind(managerController)));
router.put('/updateItemGlobalSetting', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(itemGlobalSchema), catchAsync(managerController.updateItemGlobalSetting.bind(managerController)));
router.put('/updateWarehouseProfileSetting', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(warehouseProfileSchema), catchAsync(managerController.updateWarehouseProfileSetting.bind(managerController)));

// ItemLimit CRUD routes
router.post('/itemLimits', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createItemLimitSchema), catchAsync(managerController.createItemLimit.bind(managerController)));
router.get('/itemLimits', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllItemLimits.bind(managerController)));
router.get('/itemLimits/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getItemLimitById.bind(managerController)));
router.get('/itemLimits/itemNumber/:itemNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getItemLimitByItemNumber.bind(managerController)));
router.put('/itemLimits/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateItemLimitSchema), catchAsync(managerController.updateItemLimit.bind(managerController)));
router.delete('/itemLimits/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteItemLimit.bind(managerController)));

// NotificationScheduler CRUD routes
router.post('/notificationSchedulers', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createNotificationSchedulerSchema), catchAsync(managerController.createNotificationScheduler.bind(managerController)));
router.get('/notificationSchedulers', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getNotificationSchedulerSchema), catchAsync(managerController.getAllNotificationSchedulers.bind(managerController)));
router.get('/notificationSchedulers/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getNotificationSchedulerById.bind(managerController)));
router.put('/notificationSchedulers/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateNotificationSchedulerSchema), catchAsync(managerController.updateNotificationScheduler.bind(managerController)));
router.delete('/notificationSchedulers/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteNotificationScheduler.bind(managerController)));
router.get('/notificationSchedulers/user/:userId', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getNotificationSchedulersByUser.bind(managerController)));
router.patch('/notificationSchedulers/:id/toggle', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.toggleNotificationSchedulerStatus.bind(managerController)));


// support ticket
router.get('/supportTicket/:status', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getSupportTicket.bind(managerController)));
router.put('/supportTicket/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateSupportTicket.bind(managerController)));

router.put('/setCustomerLimit/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.setCustomerLimit.bind(managerController)));

router.put('/updateRetailer/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateRetailer.bind(managerController)));
// Link CRUD routes
router.post('/links', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('logo'), validateRequest(createLinkSchema), catchAsync(managerController.createLink.bind(managerController)));
router.get('/links', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllLinks.bind(managerController)));
router.get('/links/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getLinkById.bind(managerController)));
router.put('/links/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('logo'), catchAsync(managerController.updateLink.bind(managerController)));
router.delete('/links/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteLink.bind(managerController)));
router.patch('/links/:id/toggle', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.toggleLinkStatus.bind(managerController)));

// Story CRUD routes
router.post('/stories', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('media'), validateRequest(createStorySchema), catchAsync(managerController.createStory.bind(managerController)));
router.get('/stories', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllStories.bind(managerController)));
router.get('/stories/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getStoryById.bind(managerController)));
router.put('/stories/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('media'), validateRequest(updateStorySchema), catchAsync(managerController.updateStory.bind(managerController)));
router.delete('/stories/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteStory.bind(managerController)));
router.patch('/stories/:id/toggle', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.toggleStoryStatus.bind(managerController)));


// RetailerProductCatalog CRUD routes
router.post('/product-catalogs', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('attachment'), validateRequest(createRetailerProductCatalogSchema), catchAsync(managerController.createRetailerProductCatalog.bind(managerController)));
router.get('/product-catalogs', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllRetailerProductCatalogs.bind(managerController)));
router.put('/product-catalogs/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateRetailerProductCatalogSchema), catchAsync(managerController.updateRetailerProductCatalog.bind(managerController)));
router.delete('/product-catalogs/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteRetailerProductCatalog.bind(managerController)));

// WebView CRUD routes
router.post('/webviews', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), validateRequest(createWebViewSchema), catchAsync(managerController.createWebView.bind(managerController)));
router.get('/webviews', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllWebViews.bind(managerController)));
router.get('/webviews/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getWebViewById.bind(managerController)));
router.put('/webviews/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), validateRequest(updateWebViewSchema), catchAsync(managerController.updateWebView.bind(managerController)));
router.delete('/webviews/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteWebView.bind(managerController)));
router.get('/webviews/section/:section', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getWebViewsBySection.bind(managerController)));
router.get('/webviews/grouped', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getWebViewsGroupedBySection.bind(managerController)));
router.get('/webviews/grouped/all', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllWebViewsGrouped.bind(managerController)));
router.post('/webviews/products-update/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateWebViewProducts.bind(managerController)));

// Retailer Request CRUD routes
router.post('/retailer-requests',
  verifyRole(ROLES.MANAGER, ROLES.SALES),
  multerUpload.fields([
    { name: 'resale_certificate_url', maxCount: 1 },
    { name: 'state_tobacco_license_url', maxCount: 1 },
    { name: 'business_license_url', maxCount: 1 },
    { name: 'owner_government_id_url', maxCount: 1 }
  ]),
  validateRequest(createRetailerRequestSchema),
  catchAsync(managerController.createRetailerRequest.bind(managerController))
);
router.get('/retailer-requests', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllRetailerRequests.bind(managerController)));
router.get('/retailer-requests/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getRetailerRequestById.bind(managerController)));
router.put('/retailer-requests/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateRetailerRequest.bind(managerController)));
router.delete('/retailer-requests/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteRetailerRequest.bind(managerController)));

// Policies CRUD routes
router.post('/policies', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createPoliciesSchema), catchAsync(managerController.createPolicies.bind(managerController)));
router.get('/policies', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getPolicies.bind(managerController)));
router.put('/policies', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updatePoliciesSchema), catchAsync(managerController.updatePolicies.bind(managerController)));
router.put('/policies/refund', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateRefundPoliciesSchema), catchAsync(managerController.updateRefundPolicies.bind(managerController)));
router.delete('/policies', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deletePolicies.bind(managerController)));

// WebCategory CRUD routes
router.post('/web-categories', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.createWebCategory.bind(managerController)));
router.get('/web-categories', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllWebCategories.bind(managerController)));
router.get('/web-categories/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getWebCategoryById.bind(managerController)));
router.put('/web-categories/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.updateWebCategory.bind(managerController)));
router.delete('/web-categories/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteWebCategory.bind(managerController)));

// WebPriceClass CRUD routes
router.post('/web-price-classes', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.createWebPriceClass.bind(managerController)));
router.get('/web-price-classes', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllWebPriceClasses.bind(managerController)));
router.get('/web-price-classes/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getWebPriceClassById.bind(managerController)));
router.put('/web-price-classes/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.updateWebPriceClass.bind(managerController)));
router.delete('/web-price-classes/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteWebPriceClass.bind(managerController)));

// WebQuickLink CRUD routes
router.post('/web-quick-links', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createWebQuickLinkSchema), catchAsync(managerController.createWebQuickLink.bind(managerController)));
router.get('/web-quick-links', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllWebQuickLinks.bind(managerController)));
router.get('/web-quick-links/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getWebQuickLinkById.bind(managerController)));
router.put('/web-quick-links/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), validateRequest(updateWebQuickLinkSchema), catchAsync(managerController.updateWebQuickLink.bind(managerController)));
router.delete('/web-quick-links/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteWebQuickLink.bind(managerController)));

// WebLocation CRUD routes
router.post('/web-locations', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createWebLocationSchema), catchAsync(managerController.createWebLocation.bind(managerController)));
router.get('/web-locations', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllWebLocations.bind(managerController)));
router.get('/web-locations/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getWebLocationById.bind(managerController)));
router.put('/web-locations/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateWebLocationSchema), catchAsync(managerController.updateWebLocation.bind(managerController)));
router.delete('/web-locations/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteWebLocation.bind(managerController)));
router.put('/setUserLimits/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.setUserDiscountLimit.bind(managerController)));
router.post('/customerCalenderList', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerCalenderList.bind(managerController)));
router.get('/getCustomerOrderByCalenderDate', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerOrderByCalenderDate.bind(managerController)));
router.get('/getCustomerTotalOrderByCustomer', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerTotalOrderByCustomer.bind(managerController)));
router.get('/customerOrderOfCurrentWeek/:customerId', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerOrderOfCurrentWeek.bind(managerController)));
router.get('/customerByIdInfoInCalender/:customerId', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerByIdInfoInCalender.bind(managerController)));

// ContactUs CRUD routes
router.post('/contact-us', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createContactUsSchema), catchAsync(managerController.createContactUs.bind(managerController)));
router.get('/contact-us', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getContactUsQuerySchema), catchAsync(managerController.getAllContactUs.bind(managerController)));
router.put('/contact-us/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateContactUs.bind(managerController)));
router.delete('/contact-us/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteContactUs.bind(managerController)));
router.get('/generateBarcodeAndUpload', catchAsync(managerController.getGenerateBarcodeAndUpload.bind(managerController)));

// EmailModule CRUD routes
router.post('/email-modules', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createEmailModuleSchema), catchAsync(managerController.createEmailModule.bind(managerController)));
router.get('/email-modules', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getEmailModulesQuerySchema), catchAsync(managerController.getAllEmailModules.bind(managerController)));
router.get('/email-modules/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getEmailModuleById.bind(managerController)));
router.put('/email-modules/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateEmailModuleSchema), catchAsync(managerController.updateEmailModule.bind(managerController)));
router.delete('/email-modules/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteEmailModule.bind(managerController)));

// EmailModuleConfig CRUD routes
router.post('/email-module-configs', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createEmailModuleConfigSchema), catchAsync(managerController.createEmailModuleConfig.bind(managerController)));
router.get('/email-module-configs', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getEmailModuleConfigsQuerySchema), catchAsync(managerController.getAllEmailModuleConfigs.bind(managerController)));
router.get('/email-module-configs/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getEmailModuleConfigById.bind(managerController)));
router.put('/email-module-configs/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateEmailModuleConfigSchema), catchAsync(managerController.updateEmailModuleConfig.bind(managerController)));
router.delete('/email-module-configs/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteEmailModuleConfig.bind(managerController)));

// CustomerAssignInvoiceTemplate CRUD routes
router.post('/customer-assign-invoice-templates', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createCustomerAssignInvoiceTemplateSchema), catchAsync(managerController.createCustomerAssignInvoiceTemplate.bind(managerController)));
router.get('/customer-assign-invoice-templates', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getCustomerAssignInvoiceTemplatesQuerySchema), catchAsync(managerController.getAllCustomerAssignInvoiceTemplates.bind(managerController)));
router.get('/customer-assign-invoice-templates/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerAssignInvoiceTemplateById.bind(managerController)));
router.put('/customer-assign-invoice-templates/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateCustomerAssignInvoiceTemplateSchema), catchAsync(managerController.updateCustomerAssignInvoiceTemplate.bind(managerController)));
router.delete('/customer-assign-invoice-templates/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteCustomerAssignInvoiceTemplate.bind(managerController)));
router.post('/customer-assign-invoice-templates/bulk-add', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(bulkAddCustomerAssignInvoiceTemplatesSchema), catchAsync(managerController.bulkAddCustomerAssignInvoiceTemplates.bind(managerController)));
router.post('/customer-assign-invoice-templates/bulk-remove', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(bulkRemoveCustomerAssignInvoiceTemplatesSchema), catchAsync(managerController.bulkRemoveCustomerAssignInvoiceTemplates.bind(managerController)));
router.delete('/customer-assign-delete/:customerNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteCustomerAssignInvoiceTemplateByCustomerNumber.bind(managerController)));
// InvoiceTemplate CRUD routes
router.post('/invoice-templates', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createInvoiceTemplateSchema), catchAsync(managerController.createInvoiceTemplate.bind(managerController)));
router.get('/invoice-templates', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getInvoiceTemplatesQuerySchema), catchAsync(managerController.getAllInvoiceTemplates.bind(managerController)));
router.get('/invoice-templates/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInvoiceTemplateById.bind(managerController)));
router.put('/invoice-templates/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateInvoiceTemplateSchema), catchAsync(managerController.updateInvoiceTemplate.bind(managerController)));
router.delete('/invoice-templates/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteInvoiceTemplate.bind(managerController)));
router.get('/customer-invoice-template/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerInvoiceTemplate.bind(managerController)));
router.get('/customer-by-invoice-id/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerByInvoiceId.bind(managerController)));
// Customer List for Trade Show routes
router.post('/customer-list-for-trade-show', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerListForTradeShow.bind(managerController)));

// Email Management CRUD routes
router.post('/email-configs', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createEmailConfigSchema), catchAsync(managerController.createEmailConfig.bind(managerController)));
router.get('/email-configs', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllEmailConfigs.bind(managerController)));
router.get('/email-configs/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getEmailConfigById.bind(managerController)));
router.put('/email-configs/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateEmailConfigSchema), catchAsync(managerController.updateEmailConfig.bind(managerController)));
router.delete('/email-configs/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteEmailConfig.bind(managerController)));
router.get('/email-configs/user/:userId', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getEmailConfigsByUser.bind(managerController)));
router.patch('/email-configs/:id/toggle', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.toggleEmailConfigStatus.bind(managerController)));
router.post('/email-configs/test', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.testEmailConfig.bind(managerController)));
router.post('/email-configs/test-email', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.testEmail.bind(managerController)));
router.post('/email-configs/test-email-marketing', catchAsync(managerController.testEmailMarketing.bind(managerController)));
// Email Marketing CRUD routes
router.post('/email-marketingv1', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createEmailMarketingSchema), catchAsync(managerController.createEmailMarketing.bind(managerController)));

router.post('/email-marketing', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createEmailMarketingSchema), catchAsync(managerController.createEmailMarketing.bind(managerController)));
router.get('/email-marketing', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getEmailMarketingQuerySchema), catchAsync(managerController.getAllEmailMarketing.bind(managerController)));
router.get('/email-marketing/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getEmailMarketingById.bind(managerController)));
router.get('/email-marketing/user/:userId', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getEmailMarketingByUser.bind(managerController)));

router.post('/uploadAttachment', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('attachment'), catchAsync(managerController.uploadAttachment.bind(managerController)));
router.post('/email-marketing/:id/send', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.sendEmailToCampaign.bind(managerController)));

// Inventory CRUD routes
router.post('/create-inventory', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.createInventory.bind(managerController)));
router.put('/edit-inventory/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.editInventory.bind(managerController)));
router.put('/edit-upc-number/:key', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.editUpcNumber.bind(managerController)));

//vendor CRUD routes
router.post('/create-vendor', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.createVendor.bind(managerController)));
router.put('/updateVendor/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateVendor.bind(managerController)));
router.get('/vendor/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getVendorById.bind(managerController)));
router.get('/customer/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerDetailsById.bind(managerController)));

//ERPUser CRUD routes
router.post('/createErpUser', validateRequest(createErpUserSchema), catchAsync(managerController.createErpUser.bind(managerController)));
router.get('/erp-users', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllErpUsers.bind(managerController)))
router.get('/erpuser/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getErpUserById.bind(managerController)))
router.put('/updateErpUser/:id', validateRequest(updateErpUserSchema), catchAsync(managerController.updateErpUser.bind(managerController)));

//Checker Users routes
router.get('/checker-users', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllCheckerUsers.bind(managerController)));

// InventoryUPC CRUD routes
router.post('/inventory-upc', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createInventoryUPCSchema), catchAsync(managerController.createInventoryUPC.bind(managerController)));
router.get('/inventory-upc/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventoryUPCById.bind(managerController)));
router.get('/inventoryForReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventoryForReport.bind(managerController)));
router.get('/customerForReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerForReport.bind(managerController)));


router.post('/inventoryItemsForUpdate', catchAsync(managerController.getInventoryItemsForUpdate.bind(managerController)));
router.post('/bulkUpdateInventory', catchAsync(managerController.bulkUpdateInventory.bind(managerController)));








router.get('/inventory/:itemNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventoryByItemNumber.bind(managerController)));
router.get('/inventoryForReport', catchAsync(managerController.getInventoryForReport.bind(managerController)));
router.put('/inventory-upc/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateInventoryUPCSchema), catchAsync(managerController.updateInventoryUPC.bind(managerController)));
router.delete('/inventory-upc/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteInventoryUPC.bind(managerController)));
router.get('/inventory-upc/item-number/:itemNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventoryUPCByItemNumber.bind(managerController)));
router.get('/inventory-upc/jurisdiction', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventoryUPCByJurisdiction.bind(managerController)));
router.get('/check-upc/:upc', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.checkUPCExists.bind(managerController)));
// EpickSetting CRUD routes
router.post('/epick-settings', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createEpickSettingSchema), catchAsync(managerController.createEpickSetting.bind(managerController)));
router.get('/epick-settings', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getEpickSettingsQuerySchema), catchAsync(managerController.getAllEpickSettings.bind(managerController)));
router.get('/epick-settings/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getEpickSettingById.bind(managerController)));
router.put('/epick-settings/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateEpickSettingSchema), catchAsync(managerController.updateEpickSetting.bind(managerController)));
router.delete('/epick-settings/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteEpickSetting.bind(managerController)));
// InvoiceSetting CRUD routes (create & update)
router.post('/invoice-setting', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createInvoiceSettingSchema), catchAsync(managerController.createInvoiceSetting.bind(managerController)));
router.put('/invoice-setting/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateInvoiceSettingSchema), catchAsync(managerController.updateInvoiceSetting.bind(managerController)));
// router.post('/pass-scan-items', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.putPassScanItem.bind(managerController)));
router.post('/createCustomer', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.createCustomer.bind(managerController)));
router.put('/updateUserAllowDiscount/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateUserAllowDiscount.bind(managerController)));

// PO Header routes
router.post('/po-order', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.createPurchaseOrder.bind(managerController)));

// Override Request routes (Distributor)
import { EpickController } from '../controllers/epick.controller';
import verifyToken from '../middlewares/verifyToken.middleware';
const epickController = new EpickController();
router.get('/pendingOverrideRequests', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(epickController.getPendingOverrideRequests.bind(epickController)));
router.get('/pendingOverrideRequests/:orderNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(epickController.getPendingOverrideRequestsByOrder.bind(epickController)));
router.get('/approvedOverrideRequests', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(epickController.getApprovedOverrideRequests.bind(epickController)));
router.get('/cancelledOverrideRequests', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(epickController.getCancelledOverrideRequests.bind(epickController)));
router.post('/approveOverrideRequest/:requestId', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(epickController.approveOverrideRequest.bind(epickController)));
router.post('/cancelOverrideRequest/:requestId', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(epickController.cancelOverrideRequestByDistributor.bind(epickController)));

// Ongoing Orders routes (Distributor/Admin)
router.get('/ongoingOrders', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(epickController.getOngoingOrders.bind(epickController)));
router.delete('/ongoingOrders/:orderNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(epickController.removeOngoingOrder.bind(epickController)));
router.put('/updateCustomer/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateCustomer.bind(managerController)));

// Driver CRUD routes
router.post('/drivers', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createDriverSchema), catchAsync(managerController.createDriver.bind(managerController)));
router.get('/drivers', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getDriversQuerySchema), catchAsync(managerController.getAllDrivers.bind(managerController)));
router.get('/drivers/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getDriverById.bind(managerController)));
router.put('/drivers/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateDriverSchema), catchAsync(managerController.updateDriver.bind(managerController)));
router.delete('/drivers/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteDriver.bind(managerController)));
router.put('/drivers/:id/location', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateDriverLocationSchema), catchAsync(managerController.updateDriverLocation.bind(managerController)));

// Vehicle CRUD routes
router.post('/vehicles', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createVehicleSchema), catchAsync(managerController.createVehicle.bind(managerController)));
router.get('/vehicles', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getVehiclesQuerySchema), catchAsync(managerController.getAllVehicles.bind(managerController)));
router.get('/vehicles/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getVehicleById.bind(managerController)));
router.put('/vehicles/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateVehicleSchema), catchAsync(managerController.updateVehicle.bind(managerController)));
router.delete('/vehicles/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteVehicle.bind(managerController)));

// Order Numbers routes
router.get('/order-numbers', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllOrderNumbers.bind(managerController)));
router.post('/order-numbers-by-customer', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllOrderNumbersByCustomer.bind(managerController)));

// Distributor Update routes
router.put('/distributorUpdate', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateDistributorSchema), catchAsync(managerController.distributorUpdate.bind(managerController)));
// Picklist CRUD routes
router.post('/picklists', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createPicklistSchema), catchAsync(managerController.createPicklist.bind(managerController)));
router.get('/picklists', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllPicklists.bind(managerController)));
router.get('/picklists/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getPicklistById.bind(managerController)));
router.put('/picklists/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updatePicklistSchema), catchAsync(managerController.updatePicklist.bind(managerController)));
router.delete('/picklists/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deletePicklist.bind(managerController)));
router.put('/makePickListPrinted/:orderNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.makePickListPrinted.bind(managerController)));
router.put('/makeBulkPickListPrinted', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.makeBulkPickListPrinted.bind(managerController)));

// FuturePricing CRUD routes
router.post('/future-pricing', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createFuturePricingSchema), catchAsync(managerController.createFuturePricing.bind(managerController)));
router.get('/future-pricing', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllFuturePricings.bind(managerController)));
router.get('/future-pricing/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getFuturePricingById.bind(managerController)));
router.put('/future-pricing/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateFuturePricing.bind(managerController)));
router.delete('/future-pricing/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteFuturePricing.bind(managerController)));

// Inventory_ItemGroups CRUD routes
router.get('/getInventoryItemGroups', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventoryItemGroups.bind(managerController)));
router.post('/inventory-item-groups', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createInventoryItemGroupSchema), catchAsync(managerController.createInventoryItemGroup.bind(managerController)));
router.put('/inventory-item-groups/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateInventoryItemGroupSchema), catchAsync(managerController.updateInventoryItemGroup.bind(managerController)));

//Inventory_Brands  CRUD routes
router.get('/getinventory-brands', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getinventorybrands.bind(managerController)));
router.post('/inventory-brands', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createInventoryBrandSchema), catchAsync(managerController.createInventoryBrand.bind(managerController)));
router.put('/inventory-brands/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateInventoryBrandSchema), catchAsync(managerController.updateInventoryBrand.bind(managerController)));

// Images routes
router.post('/uploadImages', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.uploadImages.bind(managerController)));

//Price Class update route
router.get('/getPriceClass', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getPriceClass.bind(managerController)));
router.put('/updatePriceClass/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updatePriceClassSchema), catchAsync(managerController.updatePriceClass.bind(managerController)));

// Loss Quantity
// router.get('/lossQuantityReport', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getLossQuantityReport.bind(managerController)));

// RetailerDocuments CRUD routes
router.post('/retailer-documents', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createRetailerDocumentsSchema), catchAsync(managerController.createRetailerDocuments.bind(managerController)));
router.get('/retailer-documents', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllRetailerDocuments.bind(managerController)));
router.get('/retailer-documents/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getRetailerDocumentsById.bind(managerController)));
router.put('/retailer-documents/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.updateRetailerDocuments.bind(managerController)));
router.delete('/retailer-documents/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteRetailerDocuments.bind(managerController)));

// RetailerLocation CRUD routes
router.post('/retailer-location', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createRetailerLocationSchema), catchAsync(managerController.createRetailerLocation.bind(managerController)));
router.get('/retailer-location', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getRetailerLocationQuerySchema), catchAsync(managerController.getAllRetailerLocations.bind(managerController)));
router.get('/retailer-location/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getRetailerLocationById.bind(managerController)));
router.put('/retailer-location/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateRetailerLocationSchema), catchAsync(managerController.updateRetailerLocation.bind(managerController)));
router.delete('/retailer-location/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteRetailerLocation.bind(managerController)));

// Velocity Report - Customer Group route
// router.get('/velocityReportCustomerGroup', verifyRole(ROLES.MANAGER,ROLES.SALES), catchAsync(managerController.getVelocityReportCustomerGroup.bind(managerController)));

router.get('/getShortShipmentReport', catchAsync(managerController.getShortShipmentReport.bind(managerController)));
router.get('/getVelocityReportCustomer', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getVelocityReportCustomer.bind(managerController)));
router.get('/getVelocityReportSalesRep', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getVelocityReportSalesRep.bind(managerController)));

// Retailer Location routes
router.post('/setRetailerLocation', verifyToken, catchAsync(managerController.setRetailerLocation.bind(managerController)));

//driver routes
router.get('/getAllOrderForDriver', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllOrderForDriver.bind(managerController)));
router.post('/getDeliverRouteByGoogleMap', validateRequest(createDeliveryRouteSchema), catchAsync(managerController.getDeliverRouteByGoogleMap.bind(managerController)));
router.post('/createDeliveryRoute', catchAsync(managerController.createDeliveryRoute.bind(managerController)));
router.post('/getDeliveryRoutes', catchAsync(managerController.getDeliveryRoutes.bind(managerController)));

router.get('/getARreports', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getARreports.bind(managerController)));
router.get('/getARreportsHistory', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getARreportsHistory.bind(managerController)));
router.get('/getOpenItemReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getOpenItemReport.bind(managerController)));
router.get('/getARUndepositeFund', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getARUndepositeFund.bind(managerController)));
router.get('/getARDeletedPayment', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getARDeletedPayment.bind(managerController)));
router.get('/getAgingReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAgingReport.bind(managerController)));

// PreBook CRUD routes
router.post('/pre-books', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createPreBookSchema), catchAsync(managerController.createPreBook.bind(managerController)));
router.get('/pre-books', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getPreBooksQuerySchema), catchAsync(managerController.getAllPreBooks.bind(managerController)));
router.get('/pre-books/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getPreBookById.bind(managerController)));
router.put('/pre-books/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updatePreBookSchema), catchAsync(managerController.updatePreBook.bind(managerController)));
router.delete('/pre-books/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deletePreBook.bind(managerController)));
router.get('/getArStatementReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getArStatementReport.bind(managerController)));

// TradeShow CRUD routes
router.post('/trade-shows', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createTradeShowSchema), catchAsync(managerController.createTradeShow.bind(managerController)));
router.get('/trade-shows', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getTradeShowsQuerySchema), catchAsync(managerController.getAllTradeShows.bind(managerController)));
router.get('/trade-shows/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeShowById.bind(managerController)));
router.put('/trade-shows/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateTradeShowSchema), catchAsync(managerController.updateTradeShow.bind(managerController)));
router.delete('/trade-shows/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteTradeShow.bind(managerController)));
router.delete('/deactive/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deActiveTradeShow.bind(managerController)));
// TradeShowItem CRUD routes
router.post('/trade-show-items', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createTradeShowItemSchema), catchAsync(managerController.createTradeShowItem.bind(managerController)));
router.post('/trade-show-items/bulk', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createBulkTradeShowItemsSchema), catchAsync(managerController.createBulkTradeShowItems.bind(managerController)));
router.put('/trade-show-items/bulk', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateBulkTradeShowItemsSchema), catchAsync(managerController.updateBulkTradeShowItems.bind(managerController)));
router.get('/trade-show-items', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getTradeShowItemsQuerySchema), catchAsync(managerController.getAllTradeShowItems.bind(managerController)));
router.get('/trade-show-items/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeShowItemById.bind(managerController)));
router.put('/trade-show-items/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateTradeShowItemSchema), catchAsync(managerController.updateTradeShowItem.bind(managerController)));
router.delete('/trade-show-items/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteTradeShowItem.bind(managerController)));

// TradeShowRetailer CRUD routes
router.post('/trade-show-retailers', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createTradeShowRetailerSchema), catchAsync(managerController.createTradeShowRetailer.bind(managerController)));
router.post('/trade-show-retailers/bulk', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createBulkTradeShowRetailersSchema), catchAsync(managerController.createBulkTradeShowRetailers.bind(managerController)));
router.get('/trade-show-retailers', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getAllTradeShowRetailers.bind(managerController)));
router.get('/trade-show-retailers/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeShowRetailerById.bind(managerController)));
router.put('/trade-show-retailers/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateTradeShowRetailerSchema), catchAsync(managerController.updateTradeShowRetailer.bind(managerController)));
router.delete('/trade-show-retailers/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteTradeShowRetailer.bind(managerController)));

// Inventory Valuation
router.get('/getInventorySpotCheck', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventorySpotCheck.bind(managerController)));
router.get('/getInventoryValuationSalesCategTotal', catchAsync(managerController.getInventoryValuationSalesCategTotal.bind(managerController)));
// TradeShowVendor CRUD routes
router.post('/trade-show-vendors', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createTradeShowVendorSchema), catchAsync(managerController.createTradeShowVendor.bind(managerController)));
router.post('/trade-show-vendors/bulk', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createBulkTradeShowVendorsSchema), catchAsync(managerController.createBulkTradeShowVendors.bind(managerController)));
router.get('/trade-show-vendors', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getTradeShowVendorsQuerySchema), catchAsync(managerController.getAllTradeShowVendors.bind(managerController)));
router.get('/trade-show-vendors/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeShowVendorById.bind(managerController)));
router.put('/trade-show-vendors/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateTradeShowVendorSchema), catchAsync(managerController.updateTradeShowVendor.bind(managerController)));
router.delete('/trade-show-vendors/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteTradeShowVendor.bind(managerController)));

// TradeShowVendor CRUD routes
router.get('/trade-show-vendorsIds/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getVendorListForTradeShowIds.bind(managerController)));
router.post('/getInventoryAsPerVendorIds', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventoryAsPerVendorIds.bind(managerController)));

// TradeShowDeliveryProduct CRUD routes
router.post('/trade-show-delivery-products', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createTradeShowDeliveryProductSchema), catchAsync(managerController.createTradeShowDeliveryProduct.bind(managerController)));
router.post('/trade-show-delivery-products/bulk', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createBulkTradeShowDeliveryProductsSchema), catchAsync(managerController.createBulkTradeShowDeliveryProducts.bind(managerController)));
router.get('/trade-show-delivery-products', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getTradeShowDeliveryProductsQuerySchema), catchAsync(managerController.getAllTradeShowDeliveryProducts.bind(managerController)));
router.get('/trade-show-delivery-products/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeShowDeliveryProductById.bind(managerController)));
router.put('/trade-show-delivery-products/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateTradeShowDeliveryProductSchema), catchAsync(managerController.updateTradeShowDeliveryProduct.bind(managerController)));
router.delete('/trade-show-delivery-products/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteTradeShowDeliveryProduct.bind(managerController)));
router.get('/getInventoryAsPerTradeWeek', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventoryAsPerTradeWeek.bind(managerController)));
router.get('/getTradeShowSummary/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeShowSummary.bind(managerController)));
router.get('/getTradeShowItemList/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeShowItemList.bind(managerController)));
router.post('/deleteBulkTradeShowVendors', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteBulkTradeShowVendors.bind(managerController)));
router.post('/deleteBulkTradeShowItems', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteBulkTradeShowItems.bind(managerController)));
router.post('/deleteBulkTradeShowDeliveryProducts', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteBulkTradeShowDeliveryProducts.bind(managerController)));
router.post('/deleteBulkTradeShowRetailers', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteBulkTradeShowRetailers.bind(managerController)));
// Remain Item In Delivery routes
router.post('/remain-item-in-delivery', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getRemainItemInDelivery.bind(managerController)));
// Inventory Valuation
router.get('/getInventorySpotCheck', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventorySpotCheck.bind(managerController)));
router.post('/getProductsByOrderNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getProductsByOrderNumber.bind(managerController)));
//current order status report
router.get('/currentOrderStatusReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.currentOrderStatusReport.bind(managerController)));
router.get('/currentOrderDetailStatus/:orderNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.currentOrderDetailStatus.bind(managerController)));

// Purchase Order Report routes
router.get('/poReceivingHistoryReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.poReceivingHistoryReport.bind(managerController)));
router.get('/poTransferAdjustmentReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.poTransferAdjustmentReport.bind(managerController)));
router.get('/poCigOtpReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.poCigOtpReport.bind(managerController)));

//Invoice Creation 
router.get('/createInvoice/:orderNumber', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.createInvoice.bind(managerController)));

// Invoice Register routes
router.get('/invoice-register', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInvoiceRegister.bind(managerController)));


// TradeShowItemForEdit routes
router.get('/trade-show-item-for-edit/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeShowItemForEdit.bind(managerController)));

// TradeDeliverProductsForEdit routes
router.get('/trade-deliver-products-for-edit', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeDeliverProductsForEdit.bind(managerController)));

// TradeDeliveryProductSummary routes
router.get('/trade-delivery-product-summary/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeDeliveryProductSummary.bind(managerController)));

// TradeShowRetailerForEdit routes
router.get('/trade-show-retailer-for-edit/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getTradeShowRetailerForEdit.bind(managerController)));




// Upload Item Image routes
router.post('/uploadItemImage', verifyRole(ROLES.MANAGER, ROLES.SALES), multerUpload.single('image'), catchAsync(managerController.uploadItemImage.bind(managerController)));
router.post('/bulkUploadItemImages', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(bulkUploadItemImagesSchema), catchAsync(managerController.bulkUploadItemImages.bind(managerController)));
router.get('/getCustomerListForEmailModules', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerListForEmailModules.bind(managerController)));

// ProductDiscount CRUD routes
router.post('/productDiscounts', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(createProductDiscountSchema), catchAsync(managerController.createProductDiscount.bind(managerController)));
router.get('/productDiscounts', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(getProductDiscountsQuerySchema), catchAsync(managerController.getAllProductDiscounts.bind(managerController)));
router.get('/productDiscounts/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getProductDiscountById.bind(managerController)));
router.put('/productDiscounts/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), validateRequest(updateProductDiscountSchema), catchAsync(managerController.updateProductDiscount.bind(managerController)));
router.delete('/productDiscounts/:id', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.deleteProductDiscount.bind(managerController)));
router.post('/productDiscounts/syncToRedis', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.syncProductDiscountsToRedis.bind(managerController)));

// ProductDiscount Redis routes
router.get('/productDiscounts-redis', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getProductDiscountsFromRedis.bind(managerController)));
router.post('/productDiscounts-redis/calculatePrice', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getDiscountedPriceFromRedis.bind(managerController)));

router.get('/getTodayCount', catchAsync(managerController.getTodayCount.bind(managerController)));

router.get('/getActiveMobileDevice', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getActiveMobileDevice.bind(managerController)));

// customer sales route
router.get('/customerLastSaleReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerLastSaleReport.bind(managerController)));
router.get('/customerNoSalesReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerNoSalesReport.bind(managerController)));
router.get('/customerWithProfit', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerWithProfit.bind(managerController)));
router.get('/customerRankingSales', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerRankingSales.bind(managerController)));
router.get('/dailySalesReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getDailySalesReport.bind(managerController)));
router.get('/customerPrepaidSalesTax', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getCustomerPrepaidSalesTax.bind(managerController)));
router.get('/deletedOrders', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getDeletedOrders.bind(managerController)));
router.get('/lostSaleCurrentOrders', catchAsync(managerController.getLostSaleCurrentOrders.bind(managerController)));

router.get('/inventoryLogHistory', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getInventoryLogHistory.bind(managerController)));

router.get('/salesInvoiceReport', verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(managerController.getSalesInvoiceReport.bind(managerController)));

export default router;  
