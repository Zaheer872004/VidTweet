import mongoose,{Model, Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {

        title :  { 
            type : String,
            required : true,
        },
        description : {
            type : String,
            required : true
        },
        videoFile : {
            type : String,  // cloudinary url
            required : true,
        },
        thumbnail : {
            type : String,  // cludinary url
            required : true,
        },
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User"
        },
        duration : {
            type : Number, // cloudinary object
            required : true
        },
        view:{
            type : Number,
            default : 0,
        },
        isPublised: {
            type : Boolean,
            default : true,
        }

    },{timestamps : true}
)


videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model("Vidoe",videoSchema);