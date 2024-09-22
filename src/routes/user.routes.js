import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js"
import { 
  changeUserPassword,
  getchannelDetails,
  emailVerifyUser, 
  getCurrentUser, 
  getWatchHistory, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  registerUser, 
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/getUser.middleware.js";


const router = Router();


// Without required verifyJWT middleware in this routes...

router.route("/register").post(
    // upload.any(),   // this is the middleware of the file uploaded...
    // We can also used 
    upload.fields(
      [
        {name:"avatar",maxCount:1},
        {name:"coverImage",maxCount:1}
      ]
    ),
    registerUser
)

router.route("/verify-email/:username").post(emailVerifyUser)

router.route("/login").post(loginUser)

router.route("/refresh-access-token").post(refreshAccessToken)



// With required verifyJWT middleware in this routes...

router.route("/logout").get(verifyJWT,logoutUser)

router.route("/change-password").patch(verifyJWT,changeUserPassword)

router.route("/get-user").get(verifyJWT,getCurrentUser)

router.route("/update-account-details").patch(verifyJWT,updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

// here mongodb aggregation pipeline

router.route("/getChannel-details/:username").get(verifyJWT,getchannelDetails)

router.route("/getWatchHistory").get(verifyJWT,getWatchHistory)



export default router;

