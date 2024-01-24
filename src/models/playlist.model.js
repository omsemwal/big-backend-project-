import mongoose, { Schema, SchemaType, SchemaTypeOptions } from "mongoose";
import { user } from "./video.model";

const playlistSchema = new Schema(
  {
    name: 
    { type: String,
     require: true
     },

    description:
     { type: String,
         require: true },

    video:
     [
        { type: Schema.Types.ObjectId,
             ref: "video" }
            ],

     owner:
         { type: Schema.Types.ObjectId,
                    ref: "User" }
                   ,     

  },
  { timestamps: true }
);

export const like = mongoose.model("Playlist", playlistSchema);
