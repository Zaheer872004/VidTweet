import logger from "../helper/logger.js"
import { asyncHandler } from "../helper/asyncHandler.js"
import { ApiError } from "../helper/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../helper/cloudinary.js"
import { ApiResponse } from "../helper/ApiResponse.js"
import { generateAccessAndRefreshToken } from "../helper/generateTokens.js"
import { options } from "../helper/HttpOption.js"
import { sendEmail } from "../helper/SentEmail.js"
import { randomNumber } from "../helper/fiveDigitsRandomNo.js";
import jwt from "jsonwebtoken"
import { Subscription } from "../models/subscription.model.js"
import mongoose, { mongo } from "mongoose"
import { Video } from "../models/video.model.js"

// User Registeration controller...

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
    // console.log("Here req object is : "+ await req);
    console.log("req file data : ", req.file);
    console.log("req files data : ", req.files);


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

    // uploadin the avatar on cloudinary...
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

    // uploading the coverImage on cloudinary...
    let coverImage;
    try {

        coverImage = await uploadOnCloudinary(coverlocalpath)
        console.log("coverImage file uploaded successfully on cloudinary :", coverImage?.url)
    } catch (error) {
        console.log("Error in uploading coverImage on cloudinary", error);

    }

    const otp = randomNumber();
    const emailSends = await sendEmail(email, username, otp);

    // not have success method directly...
    // if(emailSends.success){
    // console.log("Email send successfully")

    // }

    // Saving the user in the db
    try {
        const user = await User.create({
            fullName,
            username,
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            verifyCode: otp,
            verifyCodeExpiry: new Date(Date.now() + 60 * 60 * 1000),
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

        if (avatar) {
            await deleteOnCloudinary(avatar.public_id);
            console.log("Avatar deleted from the cloudinary...", avatar.public_id)
        }

        if (coverImage) {
            await deleteOnCloudinary(coverImage.public_id);
            console.log("CoverImage deleted from the cloudinary...", coverImage.public_id)
        }



        console.error("Error during user registration:", error);
        throw new ApiError(500, "Internal server error");
    }

})

// Verify User email with otp code...

const emailVerifyUser = asyncHandler(async (req, res) => {

    const { otp } = req.body;
    const { username } = req.params;

    if ([otp, username].some((val) => val?.trim() === "")) {
        throw new ApiError(400, "Please provide full Credentials");
    }

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
        throw new ApiError(400, "Invalid username | Provide a valid username");
    }

    // Check OTP length
    if (otp?.length !== 5) {
        throw new ApiError(400, "Invalid OTP. OTP must be a 5-digit number");
    }

    // Check if OTP is expired
    if (user.verifyCodeExpiry < Date.now()) {
        throw new ApiError(400, "OTP has expired. Please register again");
    }

    // Check if OTP matches
    if (user.verifyCode !== otp.toString()) {
        throw new ApiError(400, "Invalid OTP. Please provide the correct one");
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            "",
            "User email verified successfully"
        )
    );



})


// refreshAccessToken created when accessToken expired...

const refreshAccessToken = asyncHandler(async (req, res) => {


    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Provide the refreshToken");
    }

    try {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(400, "provide valid refresh token");
        }

        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(400, "refresh token incorrect");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        const updateUser = await User.findByIdAndUpdate(
            user._id,
            {
                refreshToken: newRefreshToken
            },
            {
                new: true
            }
        )

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token refreshed successfully"
                )
            )


    } catch (error) {
        console.log("Error while refreshing the Access token : " + error);
        throw new ApiError(400, "Error while refreshing the Access token")
    }

})


// User Login Controller...

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    if ([email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Provide full Credentials");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "Please Register first then login");
    }

    // password checking...
    const isPasswdCorrect = await user.isPasswordCorrect(password);

    if (!isPasswdCorrect) {
        throw new ApiError(400, "Please provide correct password");
    }

    // generate refresh token and access token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // inResponse removed the password and refreshToken...
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // saved in the cookies of this access and refresh tokens.
    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User LoggedIn Successfully"
            )
        )

})


// User Logout controller...
const logoutUser = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    // console.log(req.user);

    // we need to delete the accessToken and refreshToken of userId

    const user = await User.findByIdAndUpdate(userId,
        {
            refreshToken: "",
        },
        {
            new: true
        }

    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(400, "User not exists");
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                user,
                "User loggedOut Successfully"
            )
        )

})


// change current user password...
const changeUserPassword = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if ([oldPassword, newPassword, confirmPassword].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Provide full Credentials");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "User not exists");
    }

    const isPasswdCorrect = await req.user.isPasswdCorrect(oldPassword);

    if (!isPasswdCorrect) {
        throw new ApiError(400, "Please provide correct password");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "Please provide same password newPassword and confirmPassword not match");
    }

    user.password = newPassword;
    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    oldPassword,
                    newPassword,
                    confirmPassword
                },
                "Password changed successfully"
            )
        )



})

// Get the Current User...

const getCurrentUser = asyncHandler(async (req, res) => {


    const userId = req.user._id;

    // No need of checking here because we already checked in the middleware...
    // if exectution comes here means user is exist and it is authenticated...
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "User not exists");
    }

    return res
        .status(200)
        .json(

            new ApiResponse(
                200,
                user,  // here we can directly return the req.user
                "User fetched successfully"
            )
        )


})


// update the user details...

const updateAccountDetails = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const { username, fullName } = req.body;

    // here we don't check the username and fullname comes or not because it might we user only change the username or fullname...

    // but outoff two one field is required...
    if (!username && !fullName) {
        throw new ApiError(400, "Provide atleast one field to update either username or fullname");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "User not exists");
    }

    if (username) {
        user.username = username;
    }

    if (fullName) {
        user.fullName = fullName;
    }

    await user.save();

    // Another approach to update the user details...
    /*
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                $set: { 
                    ...(username && { username }), 
                    ...(fullName && { fullName }) 
                } 
            },
            { new: true,}
        ).select("-password -refreshToken")

        if (!updatedUser) {
            throw new ApiError(400, "User not exists");
        }
    */

    const updatedUser = await User.findById(userId).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    updatedUser
                },
                "Account details updated successfully"
            )
        )


})


// update the user avatar image...

const updateUserAvatar = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const avatarlocalpath = req.file.path;

    if (!avatarlocalpath) {
        throw new ApiError(400, "Please provide avatarlocalpath");
    }

    let avatar;

    try {
        avatar = uploadOnCloudinary(avatarlocalpath);

        if (!avatar.url) {
            throw new ApiError(400, "avatar.url not found");
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            {
                new: true
            }
        ).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(400, "User not exists | avatar update failed");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        user
                    },
                    "Avatar updated successfully"
                )
            )

    } catch (error) {

        if (avatar) {
            await deleteOnCloudinary(avatar.public_id);
            console.log("avatar file deleted while failing to upload on cloudinary...", avatar.public_id);
        }

        console.log("Error in uploading avatar on cloudinary", error);
        throw new ApiError(500, "Internal server error Inside the catch part of updateUserAvatar");
    }


})

// update the user coverImage...

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const coverImagelocalpath = req.file.path;

    if (!coverImagelocalpath) {
        throw new ApiError(400, "Please provide coverImagelocalpath");
    }

    let coverImage;

    try {
        coverImage = uploadOnCloudinary(coverImagelocalpath);

        if (!coverImage.url) {
            throw new ApiError(400, "coverImage.url not found");
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            {
                new: true
            }
        ).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(400, "User not exists | coverImage update failed");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        user
                    },
                    "coverImage updated successfully"
                )
            )

    } catch (error) {

        if (avatar) {
            await deleteOnCloudinary(coverImage.public_id);
            console.log("coverImage file deleted while failing to upload on cloudinary...", coverImage.public_id);
        }

        console.log("Error in uploading coverImage on cloudinary", error);
        throw new ApiError(500, "Internal server error Inside the catch part of updateUserCoverImage");
    }


})


//# From here Mongodb Aggregation Started...

// getting the channel details...

const getchannelDetails = asyncHandler( async (req,res) => {

    // const userId = req.user._id;

    const username = req.params.username;

    if(!username){
        throw new ApiError(400, "Please provide username");
    }

    // const user = await User.findOne({ username });

    // if(!user){
    //     throw new ApiError(400, "User not exists");
    // }

    // const userId = user._id;

    const channel = await User.aggregate(
        [
            {
                $match : {
                    username : username
                }
            },
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "channel",
                    as : "subscribers"
                }
            },
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "subscriber",
                    as : "subscribedTo"
                }
            },
            {
                $lookup: {
                    from: "users", // Assuming your users collection is named 'users'
                    localField: "subscribers.subscriber", // Field in your current collection
                    foreignField: "_id", // Matching field in the 'users' collection
                    as: "subscriberDetails" // The field to store the resulting subscriber data
                }
            },
            {
                $addFields : {
                    subscribersCount : {
                        $size : "$subscribers"
                    },
                    subscribedToCount : {
                        $size : "$subscribedTo"
                    },
                    isSubscribe: {
                        $cond: [ // here below same as ternary operator works...
                            { 
                                $in: [req.user?._id, "$subscribers.subscriber"] 
                            },
                            true,
                            false
                        ]
                    }
                }
            },
            {
                $project : {
                    username : 1,
                    fullName : 1,
                    email    : 1,
                    avatar   : 1,
                    subscribersCount    : 1,
                    subscribedToCount   : 1,
                    isSubscribe : 1,
                    createdAt   : 1,
                    subscriberDetails : 1,
                    
                }
            }

        ]
    )

    if(!channel?.length){
        throw new ApiError(400, "User not exists | channel not found");
    }

    // console.log("Here is a channel: " + JSON.stringify(channel, null, 2));
    // console.log("Here is a channel with zeroth index: " + JSON.stringify(channel[0], null, 2));


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    data : channel[0]
                },
                "Channel found successfully"
            )
        )


})


// getting the User WatchHistory...

const getWatchHistory = asyncHandler( async (req,res) => {
    console.log(req.user.username);

    const watchHistory = await User.aggregate(
        [
            {
                // new mongoose.Types.ObjectId(req.user._id)
                $match : {
                    _id : new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "watchHistory",
                    foreignField : "_id",
                    as : "watchHistory",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner",
                                pipeline : [
                                    {
                                        $project : {
                                            username : 1,
                                            fullName : 1,
                                            avatar : 1,
                                            
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        },
                        {
                            $project : {
                                title : 1,
                                description : 1,
                                thumbnail : 1,
                                videoFile : 1,
                                view : 1,
                                duration : 1,
                                createdAt : 1,
                                owner : 1,
                                createdAt : 1,
                            }
                        }
                    ]
                }
            },
            {
                $project : {
                    username : 1,
                    fullName : 1,
                    watchHistory : 1,
                    avatar : 1,
                }
            }
        ]
    )

    if(!watchHistory?.length){
        throw new ApiError(400, "User not exists | watchHistory not found");
    }

    // console.log("Here is a watchHistory: " + JSON.stringify(watchHistory, null, 2));
    // console.log("Here is a watchHistory with zeroth index: " + JSON.stringify(watchHistory[0], null, 2));


    return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    data : watchHistory[0]
                },
                "WatchHistory found successfully"
            )
        )

})




export {
    registerUser,
    emailVerifyUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getchannelDetails,
    getWatchHistory

}

