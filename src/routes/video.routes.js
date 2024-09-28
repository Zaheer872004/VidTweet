import { Router } from "express";
import { 
    createVideo,
    deleteVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus,
    updateVideoDetails,
    updateVideoThumbnail,
    videoHealthCheck, 
} from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/getUser.middleware.js"

const router = Router();


router.route("/video-testing").get(videoHealthCheck)

router.route("/upload-video").post(
    verifyJWT,
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


router.route("/get-video/:videoId").get(verifyJWT,getVideoById)

router.route("/get-all-videos").get(getAllVideos)

router.route("/update-videoDetails/:videoId").post(verifyJWT,updateVideoDetails);

router.route("/update-video-thumbnail/:videoId").post(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideoThumbnail
)

router.route("/delete-video/:videoId").post(verifyJWT,deleteVideo)

router.route("/toggle-published-status/:videoId").post(verifyJWT,togglePublishStatus);

router.route("/getVideo/:videoId").get(verifyJWT,getVideoById);

router.route("get-all-video").get(verifyJWT,getAllVideos);




export default router