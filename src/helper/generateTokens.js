

// here generate refreshToken and AccessToken for the login process...

import { User } from "../models/user.model.js"
import { ApiError } from "./ApiError.js";

const generateAccessAndRefreshToken = async (userId) => {

    try {
        
        const user = await User.findById(userId); 

        // check user exists...
        if(!user){
            throw new ApiError(400,'User not exists');
        }

        const accessToken =  user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save();

        return { accessToken , refreshToken };

    } catch (error) {
        console.log("some thing wrong in generateAccessAndRefreshToken function : "+ error);
        throw new ApiError(500,'Problem in generating Access and Refresh Tokens');
    }
}

export {
    generateAccessAndRefreshToken,
}