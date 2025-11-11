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

 export default router;
