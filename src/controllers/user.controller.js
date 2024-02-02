
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import fs from "fs";
import { pipeline } from "stream";
import { Console } from "console";






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

const registerUser = asyncHandler( async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res


  const {fullName, email, username, password } = req.body
  //console.log("email: ", email);

  if (!fullName || !email || !username || !password) 
  throw new Error('Please provide full name, email, username, and password');


  const existedUser = await User.findOne({
      $or: [{ username }, { email }]
  })

  if (existedUser) {
      throw new ApiError(409, "User with email or username already exists")
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // let coverImageLocalPath;
  // if (req.files.coverImage.length > 0) {
  //     coverImageLocalPath = req.files.coverImage[0].path
  // }
  

  if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
      throw new ApiError(400, "Avatar file is required")
  }
 

  const user = await User.create({
      fullName:fullName, 
      email, 
      password,
      username: username.toLowerCase(),
      avatar: avatar?.url,
      coverImage: coverImage?.url || "",
     
  })

  const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
  )
  console.log(createdUser)

  if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered Successfully")
  )

} )

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
 // const REFRESH_TOKEN_SECRET = "another-secret-key";
  try {
    //console.log(req.cookies.refreshToken,"nahi aara hai")

    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "refreshToken is mandatory");
    }
    let decodeNewToken;
    try {
      decodeNewToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
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
  const { fullName, email, username } = req.body;

  if (!(fullName|| email || username)) {
    throw new ApiError(
      400,
      "plese give a updated field list for updating data"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email, username } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account deatils updated successfully"));
});
// const updateUserAvtar = asyncHandler(async (req, res) => {
//   try {
//     // Find the user to get the current avatar file path
//     const user = await User.findById(req.user?._id).select("-password");

//     if (!user) {
//       throw new ApiError(404, "User not found");
//     }

//     const avatarLocalPath = req.file?.path;

//     if (!avatarLocalPath) {
//       throw new ApiError(400, "Avatar file is missing");
//     }

//     // Delete the previous avatar file from Cloudinary
//     if (user.avatar && user.avatar.url) {
//       await deleteOnCloudinary(user.avatar.url); // Placeholder, ensure this function is implemented
//     }

//     // Upload the new avatar to Cloudinary
//     const avatar = await uploadOnCloudinary(avatarLocalPath);
//     //console.log("dcbjsb", avatar);

//     if (!avatar) {
//       throw new ApiError(400, "Error while uploading avatar to Cloudinary");
//     }

//     // Update the user with the new avatar URL
//     // let updateQuery;

//     // if (typeof user.avatar === 'string') {
//     //   // If the avatar is a string, update the entire avatar field
//     //   updateQuery = { $set: { avatar: { url: avatar.url } } };
//     // } else {
//     //   // If the avatar is an object, update only the "url" property
//     //   updateQuery = { $set: { "avatar.url": avatar.url } };
//     // }

//  console.log(typeof (user.avatar))
//  const updatedUser = await User.findByIdAndUpdate(
//   req.user?._id,
//   { $set: { avatar: { url: avatar.url } } },
//   { new: true }
// ).select("-password");


//     console.log(updatedUser);

//     return res
//       .status(200)
//       .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
//   } catch (error) {
//     throw new ApiError(500, `Something went wrong: ${error.message}`);
//   }
// });


// const updateUserAvtar= asyncHandler(async(req, res)=>{
//   const avatarLocalPath = req.file?.path

//   if(!avatarLocalPath){
//       throw new ApiError(400, "Avatar file missing")
//   }

//   // delete privious avatar file on cloudinary
//   const user = await User.findById(req.user?._id).select("-password -refreshToken")

//   const previousAvatar = user.avatar

//   if (previousAvatar.public_id) {
//       await deleteOnCloudinary(previousAvatar.public_id);
//   }
  
//   //upload in cloudinary and get a url file so
//   const avatar = await uploadOnCloudinary(avatarLocalPath);

//   // check avatar
//   if(!avatar.url){
//       throw new ApiError(400, "Error while uploading on avatar file in cloudinary")
//   }

//   // stote in database 
//   user.avatar = { key: avatar?.public_id, url: avatar?.url };
//   await user.save({ validateBeforeSave: false });
    
//   return res
//   .status(200)
//   .json(
//       new ApiResponse(
//           200,
//           user,
//           "Avatar file updated successfully !!"
//       )
//   )
// })

// const updateUserAvtar = asyncHandler(async (req, res) => {
//   try {
//     // Find the user to get the current avatar file path
//     const user = await User.findById(req.user?._id).select("-password");

//     if (!user) {
//       throw new ApiError(404, "User not found");
//     }

//     const avatarLocalPath = req.file?.path;

//     if (!avatarLocalPath) {
//       throw new ApiError(400, "Avatar file is missing");
//     }

//     // Delete the previous avatar file from Cloudinary
//     if (user.avatar && user.avatar.url) {
//       await deleteOnCloudinary(user.avatar.url); // Placeholder, ensure this function is implemented
//     }

//     // Upload the new avatar to Cloudinary
//     const avatar = await uploadOnCloudinary(avatarLocalPath);

//     if (!avatar) {
//       throw new ApiError(400, "Error while uploading avatar to Cloudinary");
//     }

//     // Update the user with the new avatar URL
//     const updatedUser = await User.findByIdAndUpdate(
//       req.user?._id,
//       { $set: { "avatar.url": avatar.url } },
//       { new: true }
//     ).select("-password");

//     return res
//       .status(200)
//       .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
//   } catch (error) {
//     throw new ApiError(500, `Something went wrong: ${error.message}`);
//   }
// });

// const  updateUserAvtar = asyncHandler(async (req, res) => {
//   try {
//     const user = await User.findById(req.user?._id).select("-password");

//     if (!user) {
//       throw new ApiError(404, "User not found");
//     }

//     const avatarLocalPath = req.file?.path;

//     if (!avatarLocalPath) {
//       throw new ApiError(400, "Avatar file is missing");
//     }

//     // Delete the previous avatar file from Cloudinary
//     if (user.avatar) {
//       await deleteOnCloudinary(user.avatar); // Placeholder, ensure this function is implemented
//     }

//     // Upload the new avatar to Cloudinary
//     const avatar = await uploadOnCloudinary(avatarLocalPath);

//     if (!avatar) {
//       throw new ApiError(400, "Error while uploading avatar to Cloudinary");
//     }

//     // Update the user with the new avatar URL
//     const updatedUser = await User.findByIdAndUpdate(
//       req.user?._id,
//       { avatar: avatar.url },
//       { new: true }
//     ).select("-password");

//     return res
//       .status(200)
//       .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
//   } catch (error) {
//     throw new ApiError(500, `Something went wrong: ${error.message}`);
//   }
// });

const updateUserAvtar = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user?._id).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }

    // Delete the previous avatar file from Cloudinary
    if (user.avatar) {
      // Ensure deleteOnCloudinary function is implemented correctly
      const deleteResult = await deleteOnCloudinary(user.avatar);

      if (deleteResult === null) {
        // Handle deletion failure, throw an error or log a message
        console.error("Failed to delete previous avatar from Cloudinary");
      }
    }

    // Upload the new avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
      throw new ApiError(400, "Error while uploading avatar to Cloudinary");
    }

    // Update the user with the new avatar URL
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      { avatar: avatar.url },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
  } catch (error) {
    throw new ApiError(500, `Something went wrong: ${error.message}`);
  }
});



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
