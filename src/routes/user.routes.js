import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshaccesstoken, changecurrentpassword, getcurrentuser, updateaccountdetails, updateuseravatar, updatecoverimage, getUserChannelProfile, getWatchHistory, subscribeToChannel, unsubscribeFromChannel, videouploadtochannel, addToWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { verifiyJWT } from "../middlewares/auth.middleware.js";
const router = Router()


router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }

    ]),
    registerUser)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,  logoutUser)

// router.route("/logout").post(verifiyJWT,logoutUser)
router.route("/refresh-token").post(refreshaccesstoken)
router.route("/change-password").post(verifyJWT,changecurrentpassword)
router.route("/current-user").get(verifyJWT,getcurrentuser)
router.route("/update-account").patch(verifyJWT,updateaccountdetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateuseravatar)
router.route("/coverImgae").patch(verifyJWT,upload.single("coverImage"),updatecoverimage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

router.route("/watchvideo").post(verifyJWT,addToWatchHistory)

router.route("/upload").post(
     upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }

    ]),
    verifyJWT,videouploadtochannel)
router.route("/subscriber").post(verifyJWT,subscribeToChannel)
router.route("/unsubscriber").post(verifyJWT,unsubscribeFromChannel)
export default router