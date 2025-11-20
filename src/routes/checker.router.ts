import { Router } from "express";
import { CheckerController } from "../controllers/checker.controller";
import { catchAsync } from "../utils/catchAsync";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";

const router = Router();
const checkerController = new CheckerController();

router.get("/getOrder", verifyRole(ROLES.CHECKER), catchAsync(checkerController.getOrder.bind(checkerController)));

export default router;