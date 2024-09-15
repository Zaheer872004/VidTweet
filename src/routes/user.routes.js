import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js"
import { registerUser } from "../controllers/user.controller.js";


const router = Router();

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


export default router;


/*
here is the logic of controller logic for the file uploading...

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Initialize variables for avatar and coverImage
    let avatar = null;
    let coverImage = null;

    // Loop through req.files to identify the avatar and coverImage based on fieldname
    req.files.forEach(file => {
      if (file.fieldname === 'avatar') {
        avatar = {
          originalName: file.originalname,
          localPath: file.path
        };
      } else if (file.fieldname === 'coverImage') {
        coverImage = {
          originalName: file.originalname,
          localPath: file.path
        };
      }
    });

    // Check if avatar is uploaded (required field)
    if (!avatar) {
      return res.status(400).json({ message: 'Avatar is required' });
    }

*/