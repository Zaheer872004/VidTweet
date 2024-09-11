import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import { loggers } from 'winston';


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY 
});

const uploadOnCloudinary = async function(localPathURL) {

    try {
        // check if localPathURL is exist.
        if(!localPathURL){
            return null;
        }

        // upload on cloudinary.
        const response = await cloudinary.uploader.upload(localPathURL,{
            resource_type : 'auto',
            public_id : 'vidTweet'
        });
        loggers.info('src url'+response.secure_url);

        fs.unlink(localPathURL);

    } catch (error) {
        fs.unlink(localPathURL);
        return null;
    }

};

export {
    uploadOnCloudinary,
}