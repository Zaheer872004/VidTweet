import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js"
import { 
  emailVerifyUser, 
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





export default router;

