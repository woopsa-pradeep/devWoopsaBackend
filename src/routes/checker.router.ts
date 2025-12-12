import { Router } from "express";
import { CheckerController } from "../controllers/checker.controller";
import { catchAsync } from "../utils/catchAsync";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";
import { multerUpload } from "../middlewares/upload.middleware";

const router = Router();
const checkerController = new CheckerController();

router.get("/getOrder", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.getOrder.bind(checkerController)));
router.get("/getCompleteCheckerOrder", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.getCompleteCheckerOrder.bind(checkerController)));
router.get("/getOrderDetails/:orderNumber", verifyRole(ROLES.MANAGER, ROLES.SALES), catchAsync(checkerController.getOrderDetails.bind(checkerController)));
router.get("/getBoxItem/:boxId", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.getBoxItem.bind(checkerController)));
router.get("/getOrderItems/:orderNumber", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.getOrderItems.bind(checkerController)));
router.post("/moveItemsToBox", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.moveItemsToBox.bind(checkerController)));
router.post("/updateItemQty", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.updateItemQty.bind(checkerController)));
router.post("/createContainerAndMoveItems", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.createContainerAndMoveItems.bind(checkerController)));
router.post("/readyForDelivery/:orderNumber", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.readyForDelivery.bind(checkerController)));
router.post("/capturePhotos/:orderNumber", verifyRole(ROLES.CHECKER, ROLES.SALES), multerUpload.array('images'), catchAsync(checkerController.capturePhotos.bind(checkerController)));
router.post("/printLabels", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.printLabels.bind(checkerController)));
router.get("/testLabels", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.generateTestLabels.bind(checkerController)));
router.get("/getOrderPhotos/:orderNumber", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.getOrderPhotos.bind(checkerController)));
router.post("/updateBoxPhotos/:orderNumber", verifyRole(ROLES.CHECKER, ROLES.SALES), multerUpload.array('images'), catchAsync(checkerController.updateBoxPhotos.bind(checkerController)));
router.post("/deleteBoxPhoto/:orderNumber", verifyRole(ROLES.CHECKER, ROLES.SALES), catchAsync(checkerController.deleteBoxPhoto.bind(checkerController)));



router.put('/requestAllStatusOverride/:orderNumber',verifyRole(ROLES.MANAGER,ROLES.CHECKER, ROLES.SALES),catchAsync(checkerController.requestAllStatusOverride.bind(checkerController)));


export default router;