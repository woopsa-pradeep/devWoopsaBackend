import { Router } from "express";
import { CheckerController } from "../controllers/checker.controller";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";
import { catchAsync } from "../utils/catchAsync";
import { orderPickCreateSchema } from "../validations/epik.validation";
import { validateRequest } from "../middlewares/validation.middleware";
import { multerUpload } from "../middlewares/upload.middleware";
import { hasExistingOrder, hasOrderTakenByOtherPicker } from "../middlewares/epick.middleware";


const router = Router();
const checkerController = new CheckerController();


 router.post("/login", (req, res) => checkerController.loginChecker(req, res));



export default router;