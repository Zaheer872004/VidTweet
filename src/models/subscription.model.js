import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber : {  // like me as a end user watching the videos
            type : Schema.Types.ObjectId,
            ref : "User", 
        },
        channel : {  // like a abhishek vermalla which has published a video.
            type : Schema.Types.ObjectId,
            ref : "User",    
        }
    },
    {
        timestamps : true
    }
)


export const Subscription = mongoose.model("Subscriptin",subscriptionSchema);