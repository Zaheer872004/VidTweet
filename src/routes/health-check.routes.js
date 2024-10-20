import { Router } from "express"
import { healthCheck } from "../controllers/health-check.controller.js";

const router = Router();


router.route("/").get(healthCheck)
router.route("/test").get(healthCheck)




export default router;
