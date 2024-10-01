import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../helper/ApiResponse.js";
import { ApiError } from "../helper/ApiError.js";
import { asyncHandler } from "../helper/asyncHandler.js";




const getChannelStats = asyncHandler(async (req, res) => {

    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId  = req.user._id;

    if(!userId){
        throw new ApiError(400, "Please provide channelId");
    }

    // here  channelId(Subscription) == req.user._id = userId(User) = owner(Video)

    const totalSubscribers = await Subscription.countDocuments(
        {
            channel : new mongoose.Types.ObjectId(userId) // userId is more one
        }
    )

    const videoStats = await Video.aggregate(
        [
            {
                $match : {
                    owner : new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "video",
                    as : "likesDetails"
                }
            },
            {
                $addFields : {
                    likesCount : {
                        $size : "$likesDetails"
                    },
                    totalViwes : {
                        $sum : "$view"
                    }
                }
            },
            {
                $project : {
                    title : 1,
                    description : 1,
                    thumbnail : 1,
                    videoFile : 1,
                    duration : 1,
                    likesCount : 1,
                    totalViwes : 1
                }
            }
        ]
    )

    const totalvideo = videoStats.length;


    return res.status(200).json(
        new ApiResponse(
            200,
            {
                data : {
                    totalSubscribers,
                    totalvideo,
                    videoStats
                }
            },
            "Getting Successfully channel Stats"
        )
    )

})


const getChannelVideos = asyncHandler(async (req, res) => {

    // TODO: Get all the videos uploaded by the channel

    const userId  = req.user._id;

    if(!userId){
        throw new ApiError(400, "Please provide channelId");
    }

    // here  channelId(Subscription) == req.user._id = userId(User) = owner(Video)

    const channelVideo = await Video.aggregate(
        [
            {
                $match : {
                    owner : new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner"
                }
            },
            {
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "video",
                    as : "likes"
                }
            },
            {
                $lookup : {
                    from : "comments",
                    localField : "_id",
                    foreignField : "video",
                    as : "comments"
                }
            },
            {
                $addFields : {
                    likesCount : {
                        $size : "$likes"
                    },
                    commentCount : {
                        $size : "$comments"
                    }
                }
            },
            {
                $project : {
                    title : 1,
                    description : 1,
                    videoFile : 1,
                    thumbnail : 1,
                    duration : 1,
                    views : 1,
                    isPublished : 1,
                    createdAt : 1,
                    owner : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    likesCount : 1,
                    commentCount : 1
                }
            }
        ]
    )

    if(channelVideo.length === 0){
        throw new ApiError(400, "Videos not found");
    }

    const videoCount = await Video.countDocuments({owner : userId});

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    channelVideo,
                    videoCount
                }
            )
        )
})


export {
    getChannelStats,
    getChannelVideos,
}