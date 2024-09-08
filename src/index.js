import { app } from "./app.js";
import  dbConnect  from "./db/index.js";
import logger from "./helper/logger.js";
logger
import dotenv from "dotenv";
dotenv.config({})


const PORT = process.env.PORT || 4000




// app.listen(PORT,()=>{
//                 console.log('server runnng in port',PORT)
// })

// console.log()

dbConnect()
.then(
    () => {
        app.listen(PORT,()=>{
            // logger.info("hello world")
            console.log(`Server running in http://localhost:${PORT}`)
        })
    }
)
.catch(err => console.log('Problem in index of Listening app'+err))










