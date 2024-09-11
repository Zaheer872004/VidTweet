import multer from "multer"


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      const randomNumber = Math.floor(Math.random() * 90000 + 10000); // Generate random 5 digits number generated.
    //   console.log(randomNumber)
      cb(null, file.originalname + '_' + randomNumber)
    }
  })
  
export const upload = multer({
      storage
})