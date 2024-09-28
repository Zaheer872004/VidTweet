
import { Router } from "express";
import { 
    createTweet, 
    deleteTweet, 
    getUserTweets, 
    updateTweet 
} from "../controllers/tweet.controller";
import { verifyJWT } from "../middleware/getUser.middleware"

const router = Router()


router.route("/create-tweet").post(createTweet)

router.route("/update-tweet/:tweetId").post(verifyJWT,updateTweet)

router.route("/delete-tweet/:tweetId").get(verifyJWT,deleteTweet)

router.route("/get-user-tweet/:userId").get(verifyJWT,getUserTweets)

export default router;