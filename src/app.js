import express from "express";

import logger from "./helper/logger.js";
import morgan from "morgan";
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express();


// we can customise the origin as well here, adding multiple origin.
app.use(cors({
  origin : process.env.CORS_ORIGIN,
  credentials : true
}))


// commmon middleware here
app.use(express.json({limit: "20kb"})) // req size must be less or equal to 20kb.
app.use(express.urlencoded({extended : true, limit : "20kb"})) // req data must be url encoded like @ # $ like this 
app.use(express.static("public"))  
app.use(cookieParser())





const morganFormat = ":method :url :status :response-time ms";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);


// routes
import heathCheckRoutes from "./routes/health-check.routes.js";

app.use("/api/v1/healthcheck", heathCheckRoutes)



export {
    app,
}