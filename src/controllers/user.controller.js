import logger from "../helper/logger.js"
import { asyncHandler } from "../helper/asyncHandler.js"
import { ApiError } from "../helper/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary , deleteOnCloudinary } from "../helper/cloudinary.js"
import { ApiResponse } from "../helper/ApiResponse.js"





const registerUser = asyncHandler(async (req, res) => {
    // here Algorithm...
    /*
    1. take the details or credentials from the req.body and req.files
    2. checking the credentials comes or not.
    3. check user exists with this details/credentials or emails
    4. getting the avatarlocalpath and coverlocalpath
    5. avatarlocalpath is required and coverlocal might be.
    6. avatar and coverImage upload on cloudinary
    7. create the new user the all details
    8. return the response
    */

    const { fullName, username, email, password } = req.body;

    /* either use below or another below one */
    // if(
    //     !fullName ||
    //     !email ||
    //     !username ||
    //     !password
    // ){
    //     throw new ApiError(400, "Provide full credential/fields");

    // }

    if (
        [fullName, email, username, password].some((val) => val?.trim() === "")
    ) {
        throw new ApiError(400, "Provide full credential/fields");
    }

    const existingUser = await User.findOne(
        {
            $or: [
                {
                    email
                },
                {
                    username
                }
            ]
        }
    )

    if (existingUser) {
        throw new ApiError(400, "User already exist");
    }

    // console.warn(req.files);
    const avatarlocalpath = req.files?.avatar ? req.files.avatar[0].path : undefined;

    const coverlocalpath = req.files?.coverImage ? req.files.coverImage[0].path : undefined;

    // no need of check avatarlocalpath exist or not becus we work inside the trycatch if error come catch is handle.
    if (!avatarlocalpath) {
        throw new ApiError(400, "Provide the avatar file correctly");

    }


    // here uploading the avatar on cloudinary...
    let avatar;
    // logger.warn("value of avatarlocalpath : "+avatarlocalpath)
    try {

        avatar = await uploadOnCloudinary(avatarlocalpath);
        console.log("Avatar file uploaded successfully on cloudinary :", avatar.url)
    } catch (error) {
        console.log("Error in uploading avatar on cloudinary", error);

    }

    // if (!avatar.secure_url) {
    //     return res.status(400).json(new ApiError(400, "Not uploaded in cloudinary"))

    // }

    // here uploading the coverImage on cloudinary...
    // logger.warn("value of avatarlocalpath : "+coverlocalpath)
    let coverImage;
    try {

        coverImage = await uploadOnCloudinary(coverlocalpath)
        console.log("coverImage file uploaded successfully on cloudinary :", coverImage?.url)
    } catch (error) {
        console.log("Error in uploading coverImage on cloudinary", error);

    }

    try {
        const user = await User.create({
            fullName,
            username,
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || ""
        })
    
        const data = await User.findById(user._id).select("-password -refreshToken");
    
        if (!data) {
            throw new ApiError(400, "Something wrong while registering user");

        }
    
        return res
            .status(201)
            .json(
                new ApiResponse(201, data, `User registered Successfully`)
            )
    
    } catch (error) {

        // if registertion failed then we have to delete the avatar and coverImage from the cloudinary.

        if(avatar){
            await deleteOnCloudinary(avatar.public_id);
            console.log("Avatar deleted from the cloudinary...",avatar.public_id)
        }

        if(coverImage){
            await deleteOnCloudinary(coverImage.public_id);
            console.log("CoverImage deleted from the cloudinary...",coverImage.public_id)
        }



        console.error("Error during user registration:", error);
        throw new ApiError(500,"Internal server error");
    }

})




export {
    registerUser,
}


