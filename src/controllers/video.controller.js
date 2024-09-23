import {Video} from "../models/video.model.js"
import { ApiResponse } from "../helper/ApiResponse.js"
import { ApiError } from "../helper/ApiError.js"
import { asyncHandler } from "../helper/asyncHandler.js"
import { 
    uploadOnCloudinary, 
    deleteOnCloudinary
} from "../helper/cloudinary.js"



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

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
        return next(new ApiError(404, "Video not found"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    video
                },
                "Video deleted successfully"
            )
        )


})




export {
    videoHealthCheck,
    createVideo,
    updateVideoDetails,
    updateVideoThumbnail,
    deleteVideo
}


/*

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

*/



