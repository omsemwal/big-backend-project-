import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
 




const verifyJwt = asyncHandler(async (req, res, next) => {
try {
  
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")   
              // console.log(token, " successfully");
  
      if (!token) {
        throw new ApiError(401, "unauthorized request !");
      }
  
      const decodetoken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

      console.log(token,process.env.ACCESS_TOKEN_SECRET)
   

      if (!decodetoken ) {
        throw new ApiError(401, " decodetoken not match !");
      }
      const user = await User.findById(decodetoken?._id).select( 
        "-passsword -refreshToken"
      );
  
     
      if (!user) { 
        throw new ApiError(401, "invalid access token");
      }
      req.user = user;
      next();
   
} catch (error) { 
  throw new ApiError(401,error?.message,"server error ")
}
});

export { verifyJwt };
