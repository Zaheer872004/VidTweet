import mongoose,{Model, Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";


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


userSchema.pre("save", async function (next){


    if(!this.isModified("password")) return next()

    // here hashing the plantextpassword
    const salt =  bcrypt.genSalt(process.env.SALTROUNDS);
    const hash =  bcrypt.hash(this.password, salt);
    this.password = hash;


    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function () {

    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            fullName : this.fullName,
            username : this.username
        },
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: ACCESS_TOKEN_EXPIRY}
    );

}


userSchema.methods.generateRefreshToken = function () {

    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET, 
        { expiresIn: REFRESH_TOKEN_EXPIRY}
    );

}

export const User = mongoose.model("User",userSchema);