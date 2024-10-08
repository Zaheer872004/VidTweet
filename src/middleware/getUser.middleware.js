import { ApiError } from "../helper/ApiError.js";
import { asyncHandler } from "../helper/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import { ApiResponse } from "../helper/ApiResponse.js";


const verifyJWT = asyncHandler( async (req, res, next) => {
    
    const accessToken = req.cookies.accessToken || req.header("authorization")?.replace("Bearer ","") || req.body.accessToken;

    if(!accessToken){
        throw new ApiError(400,"Provide the accessToken");
    } 

    try {
        const decodedToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
        
        if(!user){
            throw new ApiError(400,"provide valid access token | User not found");
        }
    
        req.user = user;
    
        next();
    } catch (error) {
        console.log("Error while verifying the access token : "+error);
        throw new ApiError(400,"provide valid access token");
    }

    

})

export {
    verifyJWT
}