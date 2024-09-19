import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js"
import { 
  changeUserPassword,
  emailVerifyUser, 
  getCurrentUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  registerUser 
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

router.route("/change-password").post(verifyJWT,changeUserPassword)

router.route("/get-user").get(verifyJWT,getCurrentUser)

router.route("/update-account-details").post(verifyJWT,updateAccountDetails)

router.route("/update-avatar").post(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/update-cover-image").post(verifyJWT,upload.single("coverImage"),updateUserCoverImage)


export default router;

