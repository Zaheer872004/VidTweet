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
                name:"videoFile"
            },
            {
                name:"thumbnail"
            }
        ]
    ), 
    createVideo
)


router.route("/get-video/:videoId").get(verifyJWT,getVideoById)

router.route("/get-all-videos").get(getAllVideos)

router.route("/update-videoDetails/:videoId").patch(verifyJWT,updateVideoDetails);


router.route("/update-video-thumbnail/:videoId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideoThumbnail
)



router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo)
// router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo)



router.route("/toggle-published-status/:videoId").get(verifyJWT,togglePublishStatus);

// router.route("/getVideo/:videoId").get(verifyJWT,getVideoById);

// router.route("get-all-video").get(verifyJWT,getAllVideos);




export default router