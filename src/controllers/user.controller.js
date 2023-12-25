// user.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

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
  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // let coverImageLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }

  // if (!avatarLocalPath) {
  //   throw new ApiError(400, "avatarlocalPath is required");
  // }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // if (!avatar || !coverImage) {
  //   throw new ApiError(400, "avatar and coverImage files are required");
  // }
  const user = await User.create({
    fullname,
    // avatar: avatar.url,
    // coverImage: coverImage.url,
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

// const generateRefrechandAccesstoken = async (userId) => {
//   try {
//     const user = await User.findById(userId)
//     console.log(user)
//     const accessToken = user.generateAccessToken()
//     const refreshToken = user.generateRefreshToken()
//     console.log( accessToken)
//     user.refreshToken = refreshToken
//     await user.save({ validateBeforeSave: false })

//     return {accessToken, refreshToken}
//   } catch (error) {
//     throw new ApiError(500, "Something went wrong while generating referesh and access token");
//   }
// };

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

    console.log("Tokens saved successfully.");

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error during token generation:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

// const generateAccessAndRefereshTokens = async(userId) =>{
//   try {
//       const user = await User.findById(userId)
//       console.log(user)
//       const accessToken = user.generateAccessToken()
//       const refreshToken = user.generateRefreshToken()

//       user.refreshToken = refreshToken
//       await user.save({ validateBeforeSave: false })

//       return {accessToken, refreshToken}

//   } catch (error) {
//       throw new ApiError(500, "Something went wrong while generating referesh and access token")
//   }
// }

// const loginuser = asyncHandler(async (req, res) => {
//   // req body -> data
//   // username or email
//   //find the user
//   //password check
//   //access and referesh token
//   //send cookie
//   const { username, email, password } = req.body;
//   if (!email) {
//     throw new ApiError(400, "username or email is required");
//   }

//   const user = await User.findOne({ $or: [{ username }, { email }] });

//   if (!user) {
//     throw new ApiError(404, "user does not exist");
//   }

//   const isvalidPassword = await user.isPasswordCorrect(password);

//   if (!isvalidPassword) {
//     throw new ApiError(401, "invalid password !");
//   }

//   //console.log(user)
//   const { accessToken, refreshToken } = await generateRefrechandAccesstoken(user._id);

//   const loggedInUser = await User.findById(user._id).select(
//     "-password -refreshTokene"
//   )

//   const options = {
//     httpOnly: true, // httpOnly true krne par server se hi cahnges kar sakte hai
//     secure: true,
//   };
//   return res
//     .status(200)
//     .cookie("accessToken", accessToken, options)
//     .cookie("refreshToken", refreshToken, options)
//     .json(
//       new ApiResponse(
//         200,
//         {
//           user: loggedInUser,
//           accessToken,
//           refreshToken,
//         },
//         "user loggedin successfully"
//       )
//     );
// });

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
    throw new ApiError(401, "Invalid user credentials");
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

export { registerUser, loginUser, logoutuser };
