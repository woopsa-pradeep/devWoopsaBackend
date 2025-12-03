import { Router } from "express";
import { CheckerController } from "../controllers/checker.controller";
import { catchAsync } from "../utils/catchAsync";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";
import { multerUpload } from "../middlewares/upload.middleware";

const router = Router();
const checkerController = new CheckerController();

router.get("/getOrder", verifyRole(ROLES.CHECKER), catchAsync(checkerController.getOrder.bind(checkerController)));
router.get("/getBoxItem/:boxId", verifyRole(ROLES.CHECKER), catchAsync(checkerController.getBoxItem.bind(checkerController)));
router.post("/moveItemsToBox", verifyRole(ROLES.CHECKER), catchAsync(checkerController.moveItemsToBox.bind(checkerController)));
router.post("/updateItemQty", verifyRole(ROLES.CHECKER), catchAsync(checkerController.updateItemQty.bind(checkerController)));
router.post("/createContainerAndMoveItems", verifyRole(ROLES.CHECKER), catchAsync(checkerController.createContainerAndMoveItems.bind(checkerController)));
router.post("/readyForDelivery/:orderNumber", verifyRole(ROLES.CHECKER), catchAsync(checkerController.readyForDelivery.bind(checkerController)));
router.post("/capturePhotos/:id", verifyRole(ROLES.CHECKER), multerUpload.array('images'), catchAsync(checkerController.capturePhotos.bind(checkerController)));
router.post("/printLabels", verifyRole(ROLES.CHECKER), catchAsync(checkerController.printLabels.bind(checkerController)));
router.get("/testLabels", verifyRole(ROLES.CHECKER), catchAsync(checkerController.generateTestLabels.bind(checkerController)));

export default router;