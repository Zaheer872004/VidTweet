
import { Router } from "express";
import { 
    createComment, 
    deleteComment, 
    getAllCommentVideo, 
    updateComment 
} from "../controllers/comment.controller";
import { verifyJWT } from "../middleware/getUser.middleware"


const router = Router()



router.route("/add-comment/:videoId").post(createComment)

router.route("/update-comment/:commentId").post(verifyJWT,updateComment)

router.route("/delete-comment/:commentId").get(verifyJWT,deleteComment)

router.route("/get-all-video-comment/:videoId").get(verifyJWT,getAllCommentVideo)


export default router;