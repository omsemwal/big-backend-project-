import { Schema } from "mongoose"
import { User } from "../models/user.model"
import { asyncHandler } from "../utils/asyncHandler"
import { ApiError } from "../utils/ApiError"
import { tweet } from "../models/tweet.model"
import { ApiResponse } from "../utils/ApiResponse"



const Tweet= asyncHandler(async(req,res)=>{

     const {content}= req.body
     if(!content ){
        throw new ApiError(400,"content is mandatory")
     }
        

     let tweet = await tweet.create({
        content,
        owner:req.user._id
     })

  if(!tweet){
    throw new ApiError(400,"something went wrong  while creating tweet")
  }
   return res.status(201)
   .json(new ApiResponse(200,tweet,"tweet creating successfully"))
})



export  {Tweet}