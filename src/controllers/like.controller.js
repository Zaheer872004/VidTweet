import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../helper/asyncHandler.js";
import { ApiResponse } from "../helper/ApiResponse.js";
import { ApiError } from "../helper/ApiError.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    
    if(!videoId){
        throw new ApiError(400, "Please provide videoId");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Video not exist");
    }

    const like = await Like.findOne(
        {
            video : videoId,
            likedBy : req.user._id
        },
        {
            new : true
        }
    )

    if(like){
        await Like.findByIdAndDelete(like._id);
    }else{
        const newLike = await Like.create(
            {
                video : videoId,
                likedBy : req.user._id
            }
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    "Video successfully liked": video
                },
                "Video liked successfully"
            )
        )
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params
    
    if(!commentId){
        throw new ApiError(400, "Please provide commentId");
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400, "Comment not exist");
    }

    const like = await Like.findOne(
        {
            comment : commentId,
            likedBy : req.user._id
        },
        {
            new : true
        }
    )

    if(like){
        await Like.findByIdAndDelete(like._id);
    }else{
        const newLike = await Like.create(
            {
                comment : commentId,
                likedBy : req.user._id
            }
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    "Comment successfully liked": comment
                },
                "Comment liked successfully"
            )
        )


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    
    const {tweetId} = req.params
    
    if(!tweetId){
        throw new ApiError(400, "Please provide tweetId");
    }   

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(400, "Tweet not exist");
    }

    const like = await Like.findOne(
        {
            tweet : tweetId,
            likedBy : req.user._id
        },
        {
            new : true
        }
    )

    if(like){
        await Like.findByIdAndDelete(like._id);
    }else{
        const newLike = await Like.create(
            {
                tweet : tweetId,
                likedBy : req.user._id
            }
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    "Tweet successfully liked": tweet
                },
                "Tweet liked successfully"
            )
        )
    
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    
    const userId = req.user._id;

    // const likes = await Like.find(
    //     {
    //         likedBy : userId
    //     }
    // )

    const likes = await Like.aggregate(
        [
            {
                $match : {
                    likedBy : mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "video",
                    foreignField : "_id",
                    as : "video",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner"
                            }
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "likedBy",
                    foreignField : "_id",
                    as : "likedBy",
                }
            },
            {
                $addFields : {
                    video : {
                        $first : "$video"
                    },
                    likedBy : {
                        $first : "$likedBy"
                    },
                    totalVideo : {
                        $size : "$video"
                    }
                }
            },
            {
                $project : {
                    video : {
                        title : 1,
                        description : 1,
                        videoFile : 1,
                        thumbnail : 1,
                        duration : 1,
                        views : 1,
                        isPublised : 1,
                        createdAt : 1,
                        updatedAt : 1,
                        owner : 1
                    },
                    likedBy : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    totalVideo : 1
                }
            }

        ]
    )

    if(likes.length === 0){
        throw new ApiError(400, "Likes not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likes,
                "Likes found successfully"
            )
        )

    
})


const getLikedComments = asyncHandler(async (req, res) => {
    
    const userId = req.user._id;

    // const likes = await Like.find(
    //     {
    //         likedBy : userId
    //     }
    // )

    const comment = await Like.aggregate(
        [
            {
                $match : {
                    likedBy : mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "comments",
                    localField : "comment",
                    foreignField : "_id",
                    as : "commentDetails",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner"
                            }
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "likedBy",
                    foreignField : "_id",
                    as : "likedBy",
                }
            },
            {
                $addFields : {
                    comment : {
                        $first : "$commentDetails"
                    },
                    likedBy : {
                        $first : "$likedBy"
                    },
                    totalComment : {
                        $size : "$commentDetails"
                    }
                }
            },
            {
                $project : {
                    comment : {
                        content : 1,
                        createdAt : 1,
                        updatedAt : 1,
                        video : 1,
                        owner : 1
                    },
                    likedBy : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    totalComment : 1
                }
            }

        ]
    )

    if(comment.length === 0){
        throw new ApiError(400, "Likes not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "Likes found successfully"
            )
        )

    
})


const getLikedTweets = asyncHandler(async (req, res) => {
    
    const userId = req.user._id;

    // const likes = await Like.find(
    //     {
    //         likedBy : userId
    //     }
    // )

    const tweet = await Like.aggregate(
        [
            {
                $match : {
                    likedBy : mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "tweets",
                    localField : "tweet",
                    foreignField : "_id",
                    as : "tweet",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner"
                            }
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "likedBy",
                    foreignField : "_id",
                    as : "likedBy",
                }
            },
            {
                $addFields : {
                    tweet : {
                        $first : "$tweet"
                    },
                    likedBy : {
                        $first : "$likedBy"
                    },
                    totaltweet : {
                        $size : "$tweet"
                    }
                }
            },
            {
                $project : {
                    tweet : {
                        content : 1,
                        createdAt : 1,
                        updatedAt : 1,
                        owner : 1
                    },
                    likedBy : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    totaltweet : 1
                }
            }

        ]
    )

    if(tweet.length === 0){
        throw new ApiError(400, "Likes not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "Likes found successfully"
            )
        )

    
})


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
    getLikedTweets,
    getLikedComments,


}



