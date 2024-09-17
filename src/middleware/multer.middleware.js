import multer from "multer"
import { randomNumber } from "../helper/fiveDigitsRandomNo.js";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
    // random 5 digits number generated.
    //   console.log(randomNumber)
      cb(null, file.originalname + '_' + randomNumber());
    }
  })
  
export const upload = multer({
      storage
})