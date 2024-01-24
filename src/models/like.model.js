import  mongoose,{ Schema, SchemaType, SchemaTypeOptions } from "mongoose"
import { user } from "./video.model"


const likeSchema=new Schema({

    video:{type:Schema.Types.ObjectId,
    ref:"video"},

    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"comment"
    },

    likedBy:{
        types:Schema.types.ObjectId,
        ref:"User"
    }
},{timestamps:true})


export const like=mongoose.model("Like",likeSchema)