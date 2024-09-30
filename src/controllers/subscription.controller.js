import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../helper/ApiError.js";
import { ApiResponse } from "../helper/ApiResponse.js";
import { asyncHandler } from "../helper/asyncHandler.js";
import mongoose from "mongoose";


const toggleSubscription = asyncHandler(async (req, res) => {
    
    const {channelId} = req.params
    
    if(!channelId){
        throw new ApiError(400,"Please provide the Channel Id");
    }

    const channel = await Subscription.findById(channelId);

    if(!channel){
        throw new ApiError(400,"Channel not exist");
    }

    const subscription = await Subscription.findOne(
        {
            subscriber : req.user._id,
            channel : channelId
        },
        {
            new : true
        }
    )

    if(subscription){
        await Subscription.deleteOne(
            {
                subscriber : req.user._id,
                channel : channelId
            }
        )
    }else{
        await Subscription.create({
            subscriber : req.user._id,
            channel : channelId
        })
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    data : subscription
                },
                "Subscription toggled successfully"
            )
        )
})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    
    const {channelId} = req.params;

    if(!channelId){
        throw new ApiError(400,"Please provide the Channel Id");
    }

    // const channel = await Subscription.findById(channelId);

    // if(!channel){
    //     throw new ApiError(400,"Channel not exist");
    // }

    const subscribers = await Subscription.aggregate(
        [
            {
                $match : {
                    channel : new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "subscriber",
                    foreignField : "_id",
                    as : "subscriberDetails"
                }
            },
            {
                $unwind : "$subscriberDetails" // its removing the array maked in the object simplely.
            },
            {
                $project : {
                    subscribersDetails : {
                        username : 1,
                        fullName : 1,
                        avatar : 1,
                    },
                    channel : 1,
                    createdAt : 1
                }
            }
        ]
    )

    if(subscribers.length === 0){
        throw new ApiError(400,"Subscribers not found");
    }

    const subscriberCount = await Subscription.countDocuments(
        {
            channel : new mongoose.Types.ObjectId(channelId)
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    subscribers,
                    subscriberCount
                },
                "Subscribers fetched successfully"
            )
        )
})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    
    const { subscriberId } = req.params

    if(!subscriberId){
        throw new ApiError(400,"Please provide the Subscriber Id");
    }

    const channels = await Subscription.aggregate(
        [
            {
                $match : {
                    subscriber : new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "channel",
                    foreignField : "_id",
                    as : "channelDetails"
                }
            },
            {
                $unwind : "$channelDetails" // its removing the array maked in the object simplely.
            },
            {
                $project : {
                    channelDetails : {
                        username : 1,
                        fullName : 1,
                        avatar : 1,
                    },
                    subscriber : 1,
                    createdAt : 1
                }
            }
        ]
    )

    if(channels.length === 0){
        throw new ApiError(400,"Channels not found");
    }

    const channelCount = await Subscription.countDocuments(
        {
            subscriber : new mongoose.Types.ObjectId(subscriberId)
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    channels,
                    channelCount
                },
                "Channels fetched successfully"
            )
        )
})




export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
}


