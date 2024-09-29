import { ApiResponse } from "../helper/ApiResponse.js";
import { asyncHandler } from "../helper/asyncHandler.js";



const healthCheck = asyncHandler(
    async (req,res)=>{
        return res
        .status(200)
        .json(
            new ApiResponse(200,"Okay","Health check passed")
        )
    }
)

export {
    healthCheck
}