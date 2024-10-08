import {Video} from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"
import { Playlist } from "../models/playlist.model.js"
import { ApiResponse } from "../helper/ApiResponse.js"
import { ApiError } from "../helper/ApiError.js"
import { asyncHandler } from "../helper/asyncHandler.js"
import { 
    uploadOnCloudinary, 
    deleteOnCloudinary
} from "../helper/cloudinary.js"
import mongoose from "mongoose"



// Video Health Check controller...

const videoHealthCheck = asyncHandler( async (req,res) => {

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                " Video Health Check is fetching successfully ",
                "Health check passed"
            )
        )

})

// Video creating controller...

const createVideo = asyncHandler( async (req,res) => {

    const {
        title, description, isPublised
    } = req.body;

    
    // checking the title and description should not be empty...
    if([title,description].some((field) => {
        field.trim() === ""
    })){
        throw new ApiError(400, "Please provide full details");
    }

    const localPathVideoFile = req.files?.videoFile[0].path;

    const localPathThumbnail = req.files?.thumbnail[0].path;

    // checking the localPathVideoFile and localPathThumbnail should not be empty...
    if(
        !localPathVideoFile || !localPathThumbnail
    ){
        throw new ApiError(400, "Please provide videoFile and thumbnail path");
    }

    // here uploading the videoFile on cloudinary...
    let videoFile;
    try {
        videoFile = await uploadOnCloudinary(localPathVideoFile);
        console.log("Video file uploaded successfully on cloudinary :", videoFile.url,videoFile.duration)
    } catch (error) {
        console.log("Error in uploading videoFile on cloudinary", error);
    }


    // here uploading the thumbnail on cloudinary...
    let thumbnail;
    try {
        thumbnail = await uploadOnCloudinary(localPathThumbnail);
        console.log("Thumbnail file uploaded successfully on cloudinary :", thumbnail.url)
    } catch (error) {
        console.log("Error in uploading thumbnail on cloudinary", error);
    }

    // here db query for creating video...
    try {
        
        const video = await Video.create({
            title,
            description,
            videoFile : videoFile.url,
            thumbnail : thumbnail.url,
            owner : req.user?._id,
            duration : videoFile.duration,
            isPublised
        });

        if(!video){
            throw new ApiError(400,"Video not created successfully");
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    {
                        video
                    },
                    "Video created successfully"
                )
            )

    } catch (error) {
        
        console.log("Error in creating video", error);

        if(videoFile){
            await deleteOnCloudinary(videoFile.public_id);
            console.log("Video file deleted from the cloudinary...", videoFile.public_id)
        }

        if(thumbnail){
            await deleteOnCloudinary(thumbnail.public_id);
            console.log("Thumbnail file deleted from the cloudinary...", thumbnail.public_id)
        }

        throw new ApiError(500, "Internal server error")

    }
})

// Here we Get the all details about the video...

const getVideoById = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params
    
    if(!videoId){
        throw new ApiError(400, "Please provide videoId");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Videos with this id not found");
    }

    const getVideoById = await Video.aggregate(
        [
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(videoId)
                }
            },
            // get owner details
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
                        },
                        
                    ]
                }
            },
            
            // get the likes of the videos
            {
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "video",
                    as : "likes",
                }
            },
            // get the comments of the videos
            {
                $lookup : {
                    from : "comments",
                    localField : "_id",
                    foreignField : "video",
                    as : "comments",
                    pipeline : [
                        {
                            $project : {
                                content : 1,
                                owner : 1,
                                createdAt : 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields : {
                    owner : {
                        $first : "$owner"
                    },
                    
                    likesCount : {
                        $size : "$likes"
                    },
                    commentsCount : {
                        $size : "$comments"
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
                $project: {
                    title: 1,
                    description: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    duration: 1,
                    view: 1,
                    isPublished: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    // owner: { 
                    //     username: 1,
                    //     fullName: 1,
                    //     avatar: 1,
                    //     email : 1,
                    // }, 
                    likesCount: 1,
                    commentsCount: 1,
                    owner: 1,
                    comments: 1,
                    isLiked: 1
                }
            }
        ]
    )

    if(getVideoById.length === 0){
        throw new ApiError(400, "Video not found");
    }

    // console.log("getVideoById", getVideoById);
    console.log("Here is a getVideoById: " + JSON.stringify(getVideoById, null, 2));


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    getVideoById
                },
                "Video found successfully"
            )
        )

})


// get all videos controller based on the query, sort, pagination,filtering...

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const filter = {};
    if (query) {
        const regex = new RegExp(query, "i");
        filter.$or = [
            { title: regex },
            { description: regex },
        ];
    }
    if (userId) {
        filter.owner = userId;
    }

    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
    }

    console.log("sortOptions", sortOptions);

    try {
        // Video aggregation pipeline
        const videos = await Video.aggregate([
            { $match: filter },
            { $sort: sortOptions },
            { $skip: (pageNumber - 1) * limitNumber },
            { $limit: limitNumber },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        { $project: { fullName: 1, username: 1, avatar: 1 } },
                    ],
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                },
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "video",
                    as: "comments",
                    pipeline: [
                        { $project: { content: 1, createdAt: 1, owner: 1 } },
                    ],
                },
            },
            {
                $addFields: {
                    likesCount: { $size: "$likes" },
                    commentCount: { $size: "$comments" },
                },
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    owner: 1,
                    duration: 1,
                    views: 1,
                    isPublised: 1,
                    comments: 1,
                    likesCount: 1,
                    commentCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]);

        if (videos.length === 0) {
            throw new ApiError(404, "Videos not found");
        }

        const totalVideos = await Video.countDocuments(filter);
        const totalPages = Math.ceil(totalVideos / limitNumber);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200, 
                    {
                        totalVideos,
                        totalPages,
                        currentPage: pageNumber,
                        limit: limitNumber,
                        videos,
                    },
                    "Videos found successfully"
                )
            );

    } catch (error) {
        console.error("Error fetching videos:", error);
        throw new ApiError(500, "Internal server error");
    }
});



// update Video details controller...

const updateVideoDetails = asyncHandler( async (req,res) => {


    const { videoId } = req.params;
    
    const { title, description } = req.body;

    if(!title && !description){
        throw new ApiError(400, "Please provide atleast One field title and description");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Video not exists");
    }


    if(
        video?.owner?.toString() !== req.user?._id.toString()
    ){
        throw new ApiError(400, "You are not authorized to update this video");
    }


    if(title){
        video.title = title;
    }

    if(description){
        video.description = description;
    }


    await video.save();


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    video
                },
                "Video updated successfully"
            )
        )
})


// update Video details controller...

const updateVideoThumbnail = asyncHandler( async (req,res) => {

    const { videoId } = req.params;

    const localPathThumbnail = req.file.path;

    if(!localPathThumbnail){
        throw new ApiError(400, "Please provide thumbnail path");
    }

    const video = await Video.findById(videoId);
    
    if(!video){
        throw new ApiError(400, "Video not exists");
    }

    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "You are not authorized to update this video");
    }

    if(video?.thumbnail){
        const publicId = video?.thumbnail?.split('/').pop().split('.')[0];
        console.log(publicId);
        await deleteOnCloudinary(publicId);
        console.log("Thumbnail file deleted of previous file from the cloudinary");
    }

    const thumbnail = await uploadOnCloudinary(localPathThumbnail);

    video.thumbnail = thumbnail.url;

    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    video
                },
                "Video thumbnail updated successfully"
            )
        )

})


// delete Video controller...

const deleteVideo = asyncHandler( async (req,res) => {

    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400, "Please provide videoId");
    }

    
    
    
    /*
    more work over here delete the video from the cloudinary and
    delete the watchHistory of User
    delete all the comment of this video
    delete all the likes of this video
    delete the video from the playlist
    
    */
   
   const video = await Video.findById(videoId);
   
   if (!video) {
        return next(new ApiError(404, "Video not found"));
    }

    if(video?.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to delete this video");
    }

    try {
        // deleting the videoFile and thumbnail from the cloudinary before deleting the video

        const videoFilePublicId = video?.videoFile?.split("/").pop().split(".")[0];
        const thumbnailPublicId = video?.thumbnail?.split("/").pop().split(".")[0];

        const videoFileDeletefromCloud = await deleteOnCloudinary(videoFilePublicId);
        
        const thumbnailDeletefromCloud = await deleteOnCloudinary(thumbnailPublicId);
        
        console.log("Video file and thumbnail deleted from the cloudinary...",videoFileDeletefromCloud,thumbnailDeletefromCloud);
    } catch (error) {
        console.log("Error in deleting video from cloudinary", error);
        throw new ApiError(500, "Internal server error");
    }

    // deleting the video from the Video entity
    await Video.findByIdAndDelete(videoId);

    // deleting the video comment from the Comment entity
    await Comment.deleteMany(
        { 
            video: videoId,
            owner: req.user._id
        }
    );

    // deleting the video likes from the likes entity
    await Like.deleteMany(
        { 
            video: videoId,
            likedBy: req.user._id 
            
        }
    );

    // deleting the video from the playlist entity
    await Playlist.deleteMany(
        {
            videos: videoId,
            owner : req.user?._id,
            
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    "Video Successfully deleted": video
                },
                "Video deleted successfully"
            )
        )


})

// togglePublishStatus controller...

const togglePublishStatus = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params


    if(!videoId){
        throw new ApiError(400, "Please provide videoId");
    }

    const videoExist = await Video.findById(videoId);

    if(videoExist?.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to update or toggle this video");
    }

    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set : {
                isPublished : !videoExist.isPublished
            }
        },
        {
            new : true
        }
    )

    if(!video){
        throw new ApiError(400, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    video
                },
                "Video toggled successfully"
            )
        )

})










export {
    videoHealthCheck,
    createVideo,
    updateVideoDetails,
    updateVideoThumbnail,
    deleteVideo,
    togglePublishStatus,
    getVideoById,
    getAllVideos,

}





