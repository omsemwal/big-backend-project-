import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema=new Schema({

    content:{
        type:String,
        require:true
    },

    video:{
        type:Schema.type.ObjectId,
        ref:"video"
    },
    owner:{
        type:Schema.type.ObjectId,
        ref:"User"
    }



},{timestamps:true})

commentSchema.plugin(mongooseAggregatePaginate)

export const comment= mongoose.model("comment", commentSchema)