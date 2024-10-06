import { ApiError } from "../helper/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import {ApiResponse} from "../helper/ApiResponse.js"
import { asyncHandler } from "../helper/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// here is the createTweet controller...
const createTweet = asyncHandler(async (req, res) => {
    
    const { content } = req.body;

    if(!content){
        throw new ApiError(400, "Please provide content");
    }

    const tweet = await Tweet.create(
        {
            content : content,
            owner : req.user?._id,
        },
        {
            new : true
        }
    );

    if(!tweet){
        throw new ApiError(400, "Unable to create tweet");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                tweet,
                "Tweet created successfully"
            )
        )
})


// here have to update the aggregation pipeline...
const getUserTweets = asyncHandler(async (req, res) => {

    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options  = {
        page : parseInt(page),
        limit : parseInt(limit)
    }

    if(!userId){
        throw new ApiError(400, "User not exists");
    }

    const user = await User.findById(userId);

    if(!user){
        throw new ApiError(400, "User not exists");
    }   

    const getUserTweets = await Tweet.aggregate(
        [
            {
                $match : {
                    owner : mongoose.Types.ObjectId(userId),
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner",
                }
            },
            {
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "tweet",
                    as : "likes",
                }
            },
            {
                $addFields : {
                    likesCount : {
                        $size : "$likes"
                    },
                    owner : {
                        $first : "$owner"
                    },
                    isLiked : {
                        $cond: [ // here below same as ternary operator works...
                            { 
                                $in: [req.user?._id, "$likes.likedBy"] 
                            },
                            true,
                            false
                        ]
                    }
                }
            },
            {
                $sort : {
                    createdAt : -1
                }
            },
            {
                $project : {
                    content : 1,
                    owner : {
                        username : 1,
                        fullName : 1,
                        avatar : 1,
                    },
                    likesCount : 1,
                    isLiked : 1,
                    createdAt : 1,
                }
            }
        ]
    )

    if(getUserTweets.length === 0){
        throw new ApiError(400, "User not exists");
    }

    const response  = await Tweet.aggregatePaginate(
        tweetAggregate,
        options
    )

    if(!response) {
        throw new ApiError(400,"unable to get the User tweets")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                response,
                "Tweets fetched successfully"
            )
        )

})

// here is the updateTweet controller...
const updateTweet = asyncHandler(async (req, res) => {
    
    const { content } = req.body;
    const { tweetId } = req.params;

    if(!content  || !tweetId ){
        throw new ApiError(400, "Please provide content and tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(400, "Tweet not found | user unauthorized");
    }

    if(req.user?._id.toString() !== tweet.owner.toString()){
        throw new ApiError(400, "You are not authorized to update this tweet");
    }

    // tweet.content = content;
    // await tweet.save();

    const response = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content : content
        },
        {
            new : true
        }
    );

    if(!response){
        throw new ApiError(400, "Unable to update tweet");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "Tweet updated successfully"
            )
        )

})

// here is the deleteTweet controller...
const deleteTweet = asyncHandler(async (req, res) => {

    const { tweetId } = req.params;

    if(!tweetId){
        throw new ApiError(400, "Please provide tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(400, "Tweet not found");
    }

    if(req.user?._id.toString() !== tweet.owner?.toString()){
        throw new ApiError(400, "You are not authorized to delete this tweet");
    }

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId); 

    if(!deleteTweet){
        throw new ApiError(400, "Unable to delete tweet");
    }

    const likedDeleted = await Like.deleteMany(
        {
            tweet : tweetId,
            likedBy : req.user?._id,
        }
    )

    if(!likedDeleted){
        throw new ApiError(400,"unable to delete the like of the tweet");
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Tweet deleted successfully"
            )
        )
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet

}

