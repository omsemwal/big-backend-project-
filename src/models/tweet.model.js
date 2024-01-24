import mongoose ,{schema} from "mongoose";


const tweetSchema=new schema({

    content:{
        type:Srtring,
        require:true
    },
    owner:{
        type: schema.types.ObjectId,
        ref:"User"
    }

},{timestamps:true})

export const tweet= mongoose.model("Tweet",tweetSchema)