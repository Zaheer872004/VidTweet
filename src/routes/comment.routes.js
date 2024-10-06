
import { Router } from "express";
import { 
    createComment, 
    deleteComment, 
    getAllCommentVideo, 
    updateComment 
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middleware/getUser.middleware.js"


const router = Router()



router.route("/add-comment/:videoId").post(createComment)

router.route("/update-comment/:commentId").post(verifyJWT,updateComment)

router.route("/delete-comment/:commentId").get(verifyJWT,deleteComment)

router.route("/get-all-video-comment/:videoId").get(verifyJWT,getAllCommentVideo)


export default router;