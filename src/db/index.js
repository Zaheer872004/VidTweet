import mongoose from "mongoose";
import logger from "../helper/logger.js";

// let DB_NAME = vidTweet;

const dbConnect = async () => {
    try {
        const dbInstance = await mongoose.connect(`${process.env.MONGODB_URI}/vidTweet`);

        // console.log(dbInstance.connection.host);
        // logger.info(`\n MongoDB connected ! DB host : ${dbInstance.connection.host}`)
        console.log(`\n MongoDB connected ! DB host : ${dbInstance.connection.host}`)

    } catch (error) {
        console.log("Error in dbConnect now : ",error);
        process.exit(1);
    }

}

export default dbConnect;

