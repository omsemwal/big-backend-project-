import { Router } from "express";
import { loginUser , registerUser,logoutuser  } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.js"
import {verifyJwt } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser )

// secured routes
router.route("/logOut").post(verifyJwt,logoutuser)

export default router



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