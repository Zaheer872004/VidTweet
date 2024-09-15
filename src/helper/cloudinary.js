import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import dotenv from "dotenv"
dotenv.config({
    
})

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY 
});


const uploadOnCloudinary = async function(localPathURL) {
    try {

        // console.log(process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_SECRET_KEY);

        if (!localPathURL) {
            console.log("Local path URL is missing.");
            return null;
        }

        console.log("Uploading file to Cloudinary from path:", localPathURL);

        const response = await cloudinary.uploader.upload(localPathURL, {
            resource_type: 'auto'
        });

        // console.log("Cloudinary upload response:", response);

        fs.unlinkSync(localPathURL);

        // this not work
        // try {
        //     await fs.unlink(localPathURL);
        //     console.log("File deleted successfully");
        // } catch (err) {
        //     console.error("Error deleting file:", err);
        // }
        return response;

    } catch (error) {
        console.error("Error in Cloudinary upload:", error.message, error.stack);
        
        fs.unlinkSync(localPathURL);
        
        // this not work
        // Ensure file is deleted even if upload fails
        // try {
        //     fs.unlinkSync(localPathURL);
        // } catch (unlinkErr) {
        //     console.error("Error deleting local file after Cloudinary upload failure:", unlinkErr);
        // }


        return null;
    }
};


const deleteOnCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw new Error('Failed to delete image from Cloudinary');
    }
};


export {
    uploadOnCloudinary,
    deleteOnCloudinary
}