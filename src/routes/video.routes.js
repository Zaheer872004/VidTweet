import { Router } from "express";
import { 
    createVideo,
    getAllVideos,
    getVideoById,
    videoHealthCheck, 
} from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/getUser.middleware.js"

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


router.route("/video/:videoId").get(verifyJWT,getVideoById)
router.route("/get-all-videos").get(getAllVideos)


export default router