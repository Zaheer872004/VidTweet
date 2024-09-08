import mongoose,{Model, Schema} from "mongoose";


const userSchema = new Schema(
    {

        username : {
            type : String,
            required : true,
            trim : true,
            unique : true
        },
        fullName : {
            type : String,
            unique : true,
            required : true,
            index : true,
        },
        email :  { 
            type : String,
            unique : true,
            required : true,
            match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        },
        password : {
            type : String, // hashed string
            required : [true,"Password is required"]
        },
        avatar : {
            type : String, // cloudinary url
            required : true

        },
        coverImage : {
            type : String, // cloudinary url
        },
        refreshToken:{
            type : String,
        }

    },{timestamps : true}
)


export const User = mongoose.model("User",userSchema);