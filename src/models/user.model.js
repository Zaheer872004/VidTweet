import mongoose, { Model, Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";


const userSchema = new Schema(
    {

        username: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },
        fullName: {
            type: String,
            unique: true,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        },
        password: {
            type: String, // hashed string
            required: [true, "Password is required"]
        },
        avatar: {
            type: String, // cloudinary url
            required: true

        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        refreshToken: {
            type: String,
        },

        // adding more field for validating the email
        verifyCode: {
            type: String
        },
        verifyCodeExpiry: {
            type: Date
        },
        isVerified: {
            type: Boolean,
            default: false
        }

    }, { timestamps: true }
)

// Just before to save in dababase we hased the password.
userSchema.pre("save", async function (next) {


    if (this.isModified("password")) {



        // here hashing the plantextpassword
        const saltRound = Number(process.env.SALT_ROUNDS)

        // const salt =  bcrypt.genSalt(saltRound);
        //  console.log(saltRound)
        this.password = await bcrypt.hash(this.password, saltRound);
        // this.password = hash;
        //  console.log(this.password);

    }

    return next();

})

// We make the method like findOne, isPasswordCorrect gives / return = true / false.
userSchema.methods.isPasswordCorrect = async function (password) {

    return await bcrypt.compare(password, this.password);

}

userSchema.methods.generateAccessToken = function () {

    // console.log("ACCESS_TOKEN_EXPIRY : ",process.env.ACCESS_TOKEN_EXPIRY);

    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

}


userSchema.methods.generateRefreshToken = function () {

    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

}


export const User = mongoose.model("User", userSchema);

