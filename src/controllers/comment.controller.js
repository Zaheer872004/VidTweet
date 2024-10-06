import mongoose from "mongoose";
import { ApiError } from "../helper/ApiError.js";
import { ApiResponse } from "../helper/ApiResponse.js";
import { asyncHandler } from "../helper/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";


const createComment = asyncHandler( async (req,res) => {

    const { content } = req.body;
    const { videoId } = req.params;

    if(!content) {
        throw new ApiError(400," Provide the content ")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"Video not exist");
    }


    const comment = await Comment.create(
        {
            content,
            video : videoId,
            owner : req.user?._id
        },
        {
            new : true
        }
    )

    if(!comment){
        throw new ApiError(400,"Unable to add a comment");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                comment,
                "Comment added on the video successfully"
            )
        )

})

const updateComment = asyncHandler( async (req,res) => {

    const { content } = req.body;
    // const { videoId , commentId } = req.params;
    const {  commentId } = req.params;


    if([content,commentId].some((field) => field.trim() === "")){
        throw new ApiError(400,"Please provide the content,videoId,commentId")
    }

    // const video = await Video.findById(videoId);

    // if(!video){
    //     throw new ApiError(400,"Video not exists");
    // }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"comment not exists");
    }

    if(comment.owner?.toString() !== req.user?._id?.toString()){
        throw new ApiError(400,"User not authorized to update the comment");
    }

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set : {
                content,
            }
        },
        {
            new : true
        }
    )

    if(!updateComment){
        throw new ApiError(400, " unable to update the comment")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                updateComment,
                "Comment update successfully"
            )
        )

})

const deleteComment = asyncHandler( async (req, res) => {

    const { commentId } = req.params;
    
    if(!commentId){
        throw new ApiError(400,"Provide the comment")
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"Comment not exist");
    }

    if(comment.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"User not authorized to delete this comment");
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId);

    if(!deleteComment){
        throw new ApiError(400,"comment not deleted");
    }

    const deletedLike = await Like.deleteMany(
        {
            comment : commentId,
            owner : req.user._id,
        }
    )

    if(!deletedLike){
        throw new ApiError(400,"unable to delete the like of the comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Comment successfully deleted"

            )
        )

}) 

const getAllCommentVideo = asyncHandler( async (req,res) => {

    const { videoId } = req.params;
    const { page = 1, limit = 10} = req.query;

    const options  = {
        page : parseInt(page),
        limit : parseInt(limit)
    }

    if(!videoId){
        throw new ApiError(400,"Please provide the video")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"Video not found");
    }

    const getAllComment = await Comment.aggregate(
        [
            {
                $match : {
                    video : new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "ownerDetails"
                }
            },
            {
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "comment",
                    as : "likes"
                }
            },
            {
                $addFields : {
                    totalLikes : {
                        $size : "$likes"
                    },
                    owner : {
                        $first : "$ownerDetails"
                    }
                }
            },
            {
                $sort : {
                    createdAt : -1
                }
            },
            {
                $project  : {
                    content : 1,
                    owner : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    totalLikes : 1,
                    createdAt : 1
                }
            }
            
        ]
    );

    if(!getAllComment.length === 0){
        throw new ApiError(400,"No comment found");
    }

    const response = await Comment.aggregatePaginate(
        getAllComment,
        options
    )

    if(!response) {
        throw new ApiError(400,"unable to get the comment")
    }

    return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                response,
                "Comment get successfully"
            )
        )
})


export {
    createComment,
    updateComment,
    deleteComment,
    getAllCommentVideo,

}
