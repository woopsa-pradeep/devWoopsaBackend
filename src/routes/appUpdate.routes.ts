import { Router } from "express";
import { updateAppVersion, checkVersionInfo } from "../controllers/appUpdate.controller";

const router = Router();

router.post("/updateAppVersion", updateAppVersion);

router.get("/checkVersionInfo", checkVersionInfo);



export default router;
