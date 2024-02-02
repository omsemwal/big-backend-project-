import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutuser,
  RefreshToken,
  changeCurrentPasssword,
  getCurrentUser,
  updateUserdeatils,
  updateUserAvtar,
  updateUsercoverImage ,
  getUserChannelProfile,
  getwatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
// secured routes
router.route("/logOut").post(verifyJwt, logoutuser); 
router.route("/refresh-token").post(RefreshToken);
router.route("/change-CurrentPasssword").post(verifyJwt, changeCurrentPasssword);
router.route("/get-CurrentUser").get(verifyJwt, getCurrentUser);
router.route("/updatedeatils ").patch(verifyJwt, updateUserdeatils);
router.route("/avatar").patch(verifyJwt,upload.single("avatar"), updateUserAvtar);
router.route("/updateUsercoverImage  ").patch(verifyJwt,upload.single("coverImage"),updateUsercoverImage );
router.route("/c/:username").get(verifyJwt, getUserChannelProfile)
router.route("/history").get(verifyJwt, getwatchHistory )
 
export default router;

// import { Router } from "express";
// import { registerUser } from "../controllers/user.controller.js";
// import { upload } from "../middlewares/multer.js";

// const router= Router()

// // router.route("/register").post(
//     // upload.fields([
//     //     {
//     //         name: "avatar",
//     //         maxCount: 1
//     //     },
//     //     {
//     //         name: "coverImage",
//     //         maxCount: 1
//     //     }
//     // ]),
// //     registerUser
// //     )

// router.post("/register", upload.fields([
//     {
//         name: "avatar",
//         maxCount: 1
//     },
//     {
//         name: "coverImage",
//         maxCount: 1
//     }
// ]), registerUser)

// export default router
