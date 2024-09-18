import logger from "../helper/logger.js"
import { asyncHandler } from "../helper/asyncHandler.js"
import { ApiError } from "../helper/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary , deleteOnCloudinary } from "../helper/cloudinary.js"
import { ApiResponse } from "../helper/ApiResponse.js"
import { generateAccessAndRefreshToken } from "../helper/generateTokens.js"
import { options } from "../helper/HttpOption.js"
import { sendEmail } from "../helper/SentEmail.js"
import { randomNumber } from "../helper/fiveDigitsRandomNo.js";
import jwt from "jsonwebtoken"

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
    const emailSends = await sendEmail(email,username,otp);
    
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
            verifyCode:otp,
            verifyCodeExpiry : new Date( Date.now() + 60 * 60 *1000 ),
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

// Verify User email with otp code...

const emailVerifyUser = asyncHandler( async(req,res) => {

    const { otp } = req.body;
    const { username } = req.params;

    if([otp,username].some((val) => val?.trim() === "")){
        throw new ApiError(400,"Please provide full Credentials");
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


// refreshAccessToken created when accessToken expired
const refreshAccessToken = asyncHandler( async (req,res) => {

    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(400,"Provide the refreshToken");
    }

    try {

        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if(!user){
            throw new ApiError(400,"provide valid refresh token");
        }

        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(400,"refresh token incorrect");
        }

        const {accessToken,refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id);

        const updateUser = await User.findByIdAndUpdate(
            user._id,
            {
                refreshToken : newRefreshToken
            },
            {
                new : true
            }
        )

        return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken : newRefreshToken,
                    },
                    "Access token refreshed successfully"
                )
            )


    } catch (error) {
        console.log("Error while refreshing the Access token : "+error);
        throw new ApiError(400,"Error while refreshing the Access token")
    }

})


// User Login Controller...

const loginUser = asyncHandler( async (req,res)=> {

    const {email, password} = req.body;

    if([email,password].some((field) => field?.trim() === "")){
        throw new ApiError(400,"Provide full Credentials");
    }

    const user = await User.findOne({email});

    if(!user){
        throw new ApiError(400,"Please Register first then login");
    }

    // password checking...
    const isPasswdCorrect = await user.isPasswordCorrect(password);

    if(!isPasswdCorrect){
        throw new ApiError(400,"Please provide correct password");
    }

    // generate refresh token and access token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

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
const logoutUser = asyncHandler( async (req,res) => {

    const userId = req.user._id;
    // console.log(req.user);

    // we need to delete the accessToken and refreshToken of userId

    const user = await User.findByIdAndUpdate(userId,
        {
            refreshToken: "",
        },
        {
            new : true
        }
    
    ).select("-password -refreshToken");

    if(!user){
        throw new ApiError(400,"User not exists");
    }

    return res
        .status(200)
        .cookie("accessToken","",{ ...options, expires: new Date(0)})
        .cookie("refreshToken","",{ ...options, expires: new Date(0)})
        .json(
            new ApiResponse(
                200,
                user,
                "User loggedOut Successfully"
            )
        )

})





export {
    registerUser,
    emailVerifyUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
}

