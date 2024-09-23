import { Router } from "express";
import { 
    createVideo,
    videoHealthCheck, 
} from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";


const router = Router();


router.route("/video-testing").get(videoHealthCheck)

router.route("/video").post(
    upload.fields(
        [
            {
                name:"videoFile",
                maxCount:1
            },
            {
                name:"thumbnail",
                maxCount:1
            }
        ]
    ), 
    createVideo
)


export default router