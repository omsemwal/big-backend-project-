//const { Schema } = require("mongoose");

//const userSchema= new mongoose.Schema({




//},{ timestamps:true})
//module.exports=mongoose.model("user", userSchema)



import mongoose ,{Schema} from "mongoose";
//var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema= new Schema({

    videoFile:{
        type:String,
        require:true,
       
    },
    
  
  
    thumbnail:{
        type:String,
        require:true,
       
    },
    title:{
        type:String,
        require:true
    },
    
   description:{
        type:String,
        require:true,
       
    },
    
    duration:{
        type:Number,
        require:true,
       
    },
      
      views:{
        type:Number,
        default:0
       
    },
    isPublished:{
        type:Boolean,
        require:true,
       
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"user"
    }

},{timestamps:true})


videoSchema.plugin(mongooseAggregatePaginate)
export  const user= mongoose.model("video", videoSchemaSchema)