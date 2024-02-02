//import { Schema } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      throw new ApiError(400, "content is mandatory");
    }

    let createdTweet = await tweet.create({
      content,
      owner: req.user?._id,
    });

    if (!createdTweet) {
      throw new ApiError(400, "something went wrong  while creating tweet");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, createdTweet, "tweet creating successfully"));
  } catch (error) {
    console.error("error creating tweet", error);
    throw new ApiError(500, "internal server Error");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  try {
    const user = await tweet.find({ owner: req.user?._id });
    if (!user) {
      throw new ApiError(400, "user has no tweets");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, user, "getuserTweet successfully"));
  } catch (error) {
    console.error("something went wrong ", error);
    throw new ApiError(500, "internal server error");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!(content && tweetId)) {
      throw new ApiError(400, "content or tweetId not available for updation");
    }

    const existingTweet = await tweet.findById(tweetId);

    if (!existingTweet) {
      throw new ApiError(400, "tweet is not available for this tweetId ");
    }

    if (existingTweet.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action"
      );
    }

    const tweetUpdate = await tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: { content },
      },
      { new: true }
    );

    res
      .status(200)
      .json(new ApiResponse(200, tweetUpdate, "tweetUpdate successfully"));
  } catch (error) {
    console.error("Error updating tweet:", error);

    res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
  }
}); 

const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params;

  if (!tweetId) {
    throw new ApiError(400, "tweetId is required");
  }

  const tweetDoc = await tweet.findById(tweetId);
  if (!tweetDoc) {
    throw new ApiError(400, "tweet  is not available for this tweetId ");
  }

  if (tweetDoc.owner.toString() !== req.user?._id) {
    throw new ApiError(401, "you are not the owner of this tweet you");
  }

  const Tdelete = await tweet.findByIdAndDelete(tweetId);
  if (!Tdelete) {
    throw new ApiError(
      400,
      "Tweet is unavailable or already deleted by the user"
    );
  }
  res.status(200).json(new ApiResponse(200, Tdelete, "Deleted Successfully "));

  //  res.status(200).json(new ApiResponse(200,"tweet delete successfully"))
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

