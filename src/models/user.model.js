//const { Schema } = require("mongoose");

//const userSchema= new mongoose.Schema({




//},{ timestamps:true})
//module.exports=mongoose.model("user", userSchema)



import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"


const userSchema= new Schema({

    username:{
        type:String,
        require:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        require:true,
        unique:true,
        lowercase:true,
        trim:true,
        
    },
    fullname:{
        type:String,
        require:true,
       
        trim:true,
        index:true
    },
    avtar:{
        type:String,
        require:true,
       
    },
    coverImage:{
        type:String
    },
     watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"video"
        }
     ],
    
    
      password:{
        type:String,
        required:[true, "password is require"]
      },

      refreshToken:{
        type:String
      }

},{timestamps:true})


userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function () {
    try {
        console.log("ID:", this._id);
        console.log("Email:", this.email);
        console.log("Username:", this.username);
        console.log("Fullname:", this.fullname);

        // Replace 'your-secret-key' with your actual secret key
       const  ACCESS_TOKEN_SECRET="chai-aur-code";
        

        return jwt.sign(
            {
                _id: this._id,
                email: this.email,
                username: this.username,
                fullname: this.fullname
            },
            ACCESS_TOKEN_SECRET,
            {
                expiresIn: "1d" // You can specify the expiration directly
            }  
        ); 
    } catch (error) {
        console.error("Error during token generation:", error);
        throw new Error("Error generating access token");
    }
};


userSchema.methods.generateRefreshToken = function () {
    try {
        // Replace 'your-refresh-token-secret-key' with your actual refresh token secret key
       const REFRESH_TOKEN_SECRET="another-secret-key";
       
        return jwt.sign(
            {
                _id: this._id,
            },
            REFRESH_TOKEN_SECRET,
            {
                expiresIn: "7d" // You can specify the expiration directly
            }
        );
    } catch (error) {
        throw new Error("Error generating refresh token");
    }
};



// userSchema.methods.generateRefreshToken = function () {
//     try {
//         return jwt.sign(
//             {
//                 _id: this._id,
//             },
//             process.env.REFRESH_TOKEN_SECRET,
//             {
//                 expiresIn: process.env.REFRESH_TOKEN_EXPIRY
//             }
//         );
//     } catch (error) {
//         throw new Error("Error generating refresh token");
//     }
// };

export const User = mongoose.model("User", userSchema)