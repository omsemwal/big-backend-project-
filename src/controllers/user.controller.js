// user.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import fs from "fs";
import { pipeline } from "stream";
// import { env } from "node:process";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res
  let { fullname, email, username, password } = req.body;

  if (!fullname || !email || !username || !password) {
    throw new ApiError(400, "all fields are required");
  }

  const existuser = await User.findOne({ $or: [{ email }, { username }] });

  if (existuser) {
    throw new ApiError(400, "email and username already exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatarlocalPath is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar || !coverImage) {
    throw new ApiError(400, "avatar and coverImage files are required");
  }
  const user = await User.create({
    fullname,
    avatar: { public_id: avatar?.public_id, url: avatar?.url },
    coverImage: { public_id: coverImage?.public_id, url: coverImage?.url },

    email,
    password,
    username,
  });
  const createUser = await User.findById(user.id).select("-password ");
  if (!createUser) {
    throw new ApiError(500, "something went wrong");
  }

  res
    .status(201)
    .json(new ApiResponse(200, createUser, "user created successfully"));
});

// const registerUser = asyncHandler(async (req, res) => {
//   try {
//       const { fullName, email, password, username } = req.body;

//       // Improved code for handling avatar file
//       let avatarLocalFile;
//       if (req.files && Array.isArray(req.files.avtar) && req.files.avtar[0]) {
//           avatarLocalFile = req.files.avtar[0].path;
//       } else {
//           throw new ApiError(400, "Avatar file is required");
//       }

//       // Improved code for handling coverImage file
//       let coverImageLocalFile;
//       if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
//           coverImageLocalFile = req.files.coverImage[0].path;
//       }

//       // Upload to cloudinary
//       const avtar = await uploadOnCloudinary(avatarLocalFile);
//       const coverImage = await uploadOnCloudinary(coverImageLocalFile);

//       // Check if avatar upload failed
//       if (!avtar || !avtar.public_id || !avtar.url) {
//           throw new ApiError(400, "Error uploading avatar");
//       }

//       // Check if coverImage upload failed
//       if (coverImage && (!coverImage.public_id || !coverImage.url)) {
//           throw new ApiError(400, "Error uploading coverImage");
//       }

//       // Store in the database
//       const user = await User.create({
//           fullName,
//           avatar: { public_id: avtar.public_id, url: avtar.url },
//           coverImage: coverImage ? { public_id: coverImage.public_id, url: coverImage.url } : null,
//           email,
//           password,
//           username: username.toLowerCase(),
//       });

//       // Remove sensitive information
//       const userIsCreated = await User.findById(user._id).select("-password -refreshToken");

//       if (!userIsCreated) {
//           throw new ApiError(500, "Something went wrong registering the user");
//       }

//       // Return the response
//       return res.status(201).json(
//           new ApiResponse(200, userIsCreated, "User registered successfully!")
//       );
//   } catch (error) {
//       // Handle the error
//       throw new ApiError(500, `Error during user registration: ${error.message}`);
//   }
// });

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log("User:", user);

    const accessToken = user.generateAccessToken();
    // console.log("AccessToken:", accessToken);

    const refreshToken = user.generateRefreshToken();
    //console.log("RefreshToken:", refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    //console.log("Tokens saved successfully.");

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error during token generation:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  // if (!username && !email) {
  //   throw new ApiError(400, "username or email is required");
  // }

  // Here is an alternative of above code based on logic discussed in video:

  const { email, username, password } = req.body;
  //console.log(email);

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "incorrect password !");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutuser = asyncHandler(async (req, res) => {
  const data = await User.findByIdAndUpdate(
    req.user._id,

    { $set: { refreshToken: undefined } },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "user logged out "));
});

const RefreshToken = asyncHandler(async (req, res) => {
  const REFRESH_TOKEN_SECRET = "another-secret-key";
  try {
    //console.log(req.cookies.refreshToken,"nahi aara hai")

    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "refreshToken is mandatory");
    }
    let decodeNewToken;
    try {
      decodeNewToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      // Handle JWT verification errors
      throw new ApiError(401, "Invalid RefreshToken");
    }
    //console.log(decodeNewToken,"chal raha hai yahin tak")
    if (!decodeNewToken) {
      throw new ApiError(401, "  newRefreshToken is incorrect ");
    }

    const user = await User.findById(decodeNewToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(400, "refresh  token is expired or used");
    }
    //console.log(user.refreshToken)

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    ); // isme refreshToken new grnrate hoga
    //console.log(refreshToken)
    const option = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: refreshToken,
          }, //isme user ke ander refreshToken me hum genrate kiya hua naya refreshToken add kar rahe hai
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPasssword = asyncHandler(async function (req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "invalid old password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "password changed successfully"));
  } catch (error) {
    throw new ApiError(500, error?.message);
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  //middleware ka use karke data fetch karke responce me direct send kar denge

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetch successsfully"));
});

const updateUserdeatils = asyncHandler(async (req, res) => {
  const { fullname, email, username } = req.body;

  if (!(fullname || email || username)) {
    throw new ApiError(
      400,
      "plese give a updated field list for updating data"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname, email, username } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account deatils updated successfully"));
});

const updateUserAvtar = asyncHandler(async (req, res) => {
  try {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }

    // Upload the new avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
      throw new ApiError(400, "Error while uploading avatar to Cloudinary");
    }

    // Find the user to get the current avatar file path
    const user = await User.findById(req.user?._id).select("-password");

    // Delete the previous avatar file from Cloudinary
    if (user && user.avatar && user.avatar.public_id) {
      await deleteOnCloudinary(user.avatar.public_id); // Placeholder, ensure this function is implemented
    }

    // Update the user with the new avatar URL
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { avatar: { public_id: avatar.public_id, url: avatar.url } } },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
  } catch (error) {
    throw new ApiError(500, `Something went wrong: ${error.message}`);
  }
});

///  how to delete past avatr image in cloudnery
// const cloudinary = require("cloudinary").v2;

// const updateUserAvatar = asyncHandler(async (req, res) => {
//   try {
//     const avatarLocalPath = req.file?.path;
//     if (!avatarLocalPath) {
//       throw new ApiError(400, "Avatar file is missing");
//     }

//     // Get the previous avatar URL
//     const user = await User.findById(req.user?._id).select("avtar");
//     const previousAvatarURL = user.avtar;

//     // Delete the previous avatar from Cloudinary
//     if (previousAvatarURL) {
//       await cloudinary.uploader.destroy(previousAvatarPublicId);
//     }

//     // Upload the new avatar to Cloudinary
//     const newAvatar = await cloudinary.uploader.upload(avatarLocalPath);

//     // Update the user document with the new avatar URL
//     const updatedUser = await User.findByIdAndUpdate(
//       req.user?._id,
//       { $set: { avtar: newAvatar.url } },
//       { new: true }
//     ).select("-password");

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         updatedUser,
//         "Avatar updated successfully"
//       )
//     );
//   } catch (error) {
//     throw new ApiError(500, "Something went wrong");
//   }
// });
const updateUsercoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
      throw new ApiError(400, "CoverImage file is missing");
    }

    // Delete the previous cover image in the database and on Cloudinary
    const user = await User.findById(req.user?._id).select(
      "-password -refreshToken"
    );

    const previousCoverImage = user.coverImage;
    if (previousCoverImage && previousCoverImage.public_id) {
      await deleteOnCloudinary(previousCoverImage.public_id);
    }

    // Upload the new cover image to Cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage) {
      throw new ApiError(400, "Error while uploading coverImage");
    }

    // Update the user with the new cover image URL
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { coverImage: coverImage.url },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "CoverImage updated successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      `Error during cover image update: ${error.message}`
    );
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
//  count subscriber and count channel subscriber 
  if (!username) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "suscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberto",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: { $ifNull: ["$suscribers", []] },
        },
        channelsubscribedtocount: {
          $size: { $ifNull: ["$subscriberto", []] },
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$suscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        channelsubscribedtocount: 1,
        isSubscribed: 1,
        // avatar: 1,
        // coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});



const getwatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              //  yahan per hum array milta hai isliye hum addfields use krke uske ander ki object value nikal lete hai
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutuser,
  RefreshToken,
  changeCurrentPasssword,
  getCurrentUser,
  updateUserdeatils,
  updateUserAvtar,
  updateUsercoverImage,
  getUserChannelProfile,
  getwatchHistory 
};
