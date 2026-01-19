import { ListController } from "../controllers/list.controller";
import verifyToken from "../middlewares/verifyToken.middleware";
import { catchAsync } from "../utils/catchAsync";
import { Router } from "express";


const router = Router();
 const listController = new ListController();

router.get('/salesCategoryList',verifyToken,catchAsync(listController.getSalesCategoryList.bind(listController)));
router.get('/priceClassList',verifyToken,catchAsync(listController.getPriceClassList.bind(listController)));
router.get('/productList',verifyToken,catchAsync(listController.getProductList.bind(listController)));
router.get('/customerList',verifyToken,catchAsync(listController.getCustomerList.bind(listController)));
router.get('/userList',verifyToken,catchAsync(listController.getUserList.bind(listController)));
router.get('/salesRepList',verifyToken,catchAsync(listController.getSalesRepList.bind(listController)));
router.get('/registerCustomerList',verifyToken,catchAsync(listController.getRegisterCustomerList.bind(listController)));
router.get('/customerRouteList',verifyToken,catchAsync(listController.getCustomerRouteList.bind(listController)));
router.get('/productListBySearch',verifyToken,catchAsync(listController.getProductListBySearch.bind(listController)));
router.get('/listOfRoutes',verifyToken,catchAsync(listController.getListOfRoutes.bind(listController)));
router.post('/listOfCustomerForEmail',verifyToken,catchAsync(listController.getListOfCustomerForEmail.bind(listController)));
router.get('/listForInventory',catchAsync(listController.getListForInventory.bind(listController)));  

router.get('/listOfCustomersCreate',verifyToken,catchAsync(listController.getListOfCustomersCreate.bind(listController)));
router.get('/listOfVendorsCreate',verifyToken,catchAsync(listController.getListOfVendorsCreate.bind(listController)));
router.get('/listOfPurchaseOrdersCreate',verifyToken,catchAsync(listController.getListOfPurchaseOrdersCreate.bind(listController)));
router.get('/listOfRoutesForDriver',verifyToken,catchAsync(listController.getListOfRoutesForDriver.bind(listController)));

router.get('/listOfUpdatePriceClass',verifyToken,catchAsync(listController.getListForUpdatePriceClass.bind(listController)));
router.get('/listofLossQuantityReport',verifyToken,catchAsync(listController.getListOfLossQuantityReport.bind(listController)));
router.get('/listOfSalesCategories',verifyToken,catchAsync(listController.getListOfSalesCategories.bind(listController)));
router.get('/listOfARreports', verifyToken,catchAsync(listController.getlistOfARreports.bind(listController)));


 export default router;
