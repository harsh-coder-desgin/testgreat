import { asyncHandler  } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloundinary} from "../utils/cloundinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { Subscription } from "../models/subcription.model.js"
import { Video } from "../models/video.model.js";
// import { getVideoDurationInSeconds } from 'get-video-duration';

const generateAccessRefreshTokens= async (userId)=>{
    try {
        const user = await User.findById(userId)
        // const accessToken=user.generateAccessToken
        // const refreshToken=user.generateRefreshToken
         const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while refresh and access token")
          
    }
}
const registerUser =asyncHandler( async (req,res)=>{
  

    const { fullName,email,username,password } = req.body
    // console.log("email",email);
    console.log(req.body,"req body");
    

    if(
        [fullName,email,username,password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    // console.log("existedUser",existedUser);
    

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);
    
    // const coverImgaeLocalPath = req.files?.coverImage[0]?.path;
    let coverImgaeLocalPath;
    if(req.files && Array.isArray(req.files.
        coverImage) && req.files.coverImage.length > 0){
            coverImgaeLocalPath = req.files.coverImage[0].path
        }

    console.log(req.files,"req files");
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
 
    const avatar = await uploadOnCloundinary(avatarLocalPath)
    const coverImage = await uploadOnCloundinary(coverImgaeLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
        avatarPublicId:avatar.public_id,
        coverimagePublicId:coverImage.public_id
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        // console.log(createdUser,"createduser");
        throw new ApiError(500,"something went wrong while registering the user")
        
    }
    // console.log(createdUser,"createduser");

    res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
} )

const loginUser = asyncHandler(async (req, res)=>{

    const {email,username,password}= req.body
    if(!(username || email)){
        throw new ApiError(400,"username or password is required")
    }

    //     if(username && email){
    //     throw new ApiError(400,"username or password is required")
    // }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(400,"user does not exits")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400,"password is wrong")
    }

    const {accessToken,refreshToken }=await generateAccessRefreshTokens(user._id)

    const loggediNUser = await User.findById(user._id).select("-password -refreshToken")

    const options ={
        httpOnly:true,
        secure :true
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user:loggediNUser,accessToken,
                refreshToken
            },
            "user loggouted sucesssfully"
        )
    )
})


const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken:""
            }
        },
        {
            new:true
        }
    )
    const options ={
        httpOnly:true,
        secure :true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))

})

const refreshaccesstoken = asyncHandler(async(req,res)=>{
    const incomeingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        // console.log(incomeingRefreshToken);
        
    // try {
        if(!incomeingRefreshToken){
            throw new ApiError(400,"unauthorized request")
        }
    try {
        const decodeedtoken = jwt.verify(
            incomeingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        // console.log(decodeedtoken,"Dww");
        
        const user = await User.findById(decodeedtoken?._id)
        // console.log(user,"user");
        
        if(!user){
            throw new ApiError(401,"invaild refresh token")
        }
        if(incomeingRefreshToken !==user?.refreshToken){
            throw new ApiError(401,"Refresh token i expired or used")
        }
    
    
        const options ={
            httpOnly:true,
            secure:true
        }
        // const {accessToken,refreshToken} =await generateAccessRefreshTokens(user._id)
        const {accessToken} =await generateAccessRefreshTokens(user._id)

        // console.log(accessToken,refreshToken,"tokens");
        
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        // .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken},
                "access token resherde"
            )
        )
        
    } catch (error) {
        throw new ApiError(401,"invaild refresh token")
    }
})



const changecurrentpassword = asyncHandler(async(req,res)=>{
    const {oldpassword,newpassword}= req.body
    // console.log(oldpassword,newpassword);
    
    const user = await User.findById(req.user?._id)
    const ispasswordcorrect = await user.isPasswordCorrect(oldpassword)

    if(!ispasswordcorrect){
        throw new ApiError(400,"invaild old pass")
    }

    user.password= newpassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"paswworrd was changed"))
})




const getcurrentuser= asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json( new ApiResponse (
        200,
        req.user,
        " user fetched"))
})


const updateaccountdetails = asyncHandler (async(req,res)=>{
    const {fullName,email}= req.body

    if(!fullName || !email){
        throw new ApiError(400,"all feids required")

    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"feilds was changed"))
})

const updateuseravatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is not provided");
    }

    const currentUser = await User.findById(req.user?._id);

    // console.log(currentUser);
     if (currentUser?.avatarPublicId) {
        await cloudinary.uploader.destroy(currentUser.avatarPublicId);
    }
    
    const avatar = await uploadOnCloundinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }
    // console.log(currentUser.avatarPublicId);


   
    // cloudinary.api.delete_resources(['zombie', 'human'], function(result) { console.log(result) });
    const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
                avatarPublicId:avatar.public_id
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar was changed"));
});




const updatecoverimage = asyncHandler (async(req,res)=>{
    const coverImagelocalpath = req.file?.path

    if(!coverImagelocalpath){
        throw new ApiError(400,"updatecoverimage fiel is not ")
    }

    const currentUser = await User.findById(req.user?._id);

    if (currentUser?.coverimagePublicId) {
        await cloudinary.uploader.destroy(currentUser.coverimagePublicId);
    }

    const coverImage = await uploadOnCloundinary(coverImagelocalpath)
    
    if(!coverImage.url){
        throw new ApiError(400,"updatecoverimage fiel is not error while upload ")
    }
   
    const user = await User.findByIdAndUpdate(
        req.user?._id,
    {
        $set:{
            coverImage:coverImage.url,
            coverimagePublicId: coverImage.public_id
        }
    },
        {new:true}    
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"feilds coverimage was changed"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    // const user= req.user
    const { username } = req.params;

    console.log(username,"hhj",req.params);
//       console.log(req.params); // [Object: null prototype] { username: 'john' }
//   console.log(req.params.username); // "john"
    if(!username){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
  {
    $match: {
      username: username
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "channel",
      as: "subscribers"
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribersTo"
    }
  },
  {
    $addFields: {
      subscribersCount: { $size: "$subscribers" },
      channelSubcribertoCount: { $size: "$subscribersTo" },
      isSubcribed: {
        $cond: {
          if: { $in: [req.user?._id, "$subscribers.subscriber"] },
          then: true,
          else: false
        }
      }
    }
  },
  {
    $project: {
      fullName: 1,
      username: 1,
      subscribersCount: 1,
      channelSubcribertoCount: 1,
      isSubcribed: 1,
      avatar: 1,
      coverImage: 1,
      email: 1
    }
  }
]);

    
    if(!channel?.length){
        throw new ApiError(400,"channel is not exist ")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user succesufully fecth")
    )
})


const subscribeToChannel = asyncHandler(async (req, res) => {
  const subscriberId = req.user._id; // user performing the subscription
  const { channelId } = req.body;    // ID of the channel being subscribed to
    console.log(subscriberId,channelId);
    
  if (subscriberId.toString() === channelId) {
    throw new ApiError(400, "You cannot subscribe to yourself.");
  }

  // Check if already subscribed
  const alreadySubscribed = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (alreadySubscribed) {
    throw new ApiError(409, "Already subscribed to this channel.");
  }

  const subscription = await Subscription.create({
    subscriber: subscriberId,
    channel: channelId,
  });

  res.status(201).json(new ApiResponse(201, subscription, "Subscribed successfully"));
});





const unsubscribeFromChannel = asyncHandler(async (req, res) => {
  const subscriberId = req.user._id;
  const { channelId } = req.body;

  const result = await Subscription.findOneAndDelete({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (!result) {
    throw new ApiError(404, "Not subscribed to this channel.");
  }

  res.status(200).json(new ApiResponse(200, null, "Unsubscribed successfully"));
});


const videouploadtochannel = asyncHandler(async(req,res)=>{
    const {title,description} = req.body
    // console.log(req.body);
    
    if(
        [title,description].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }
    // console.log(req.files);
    
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
        // console.log(videoFileLocalPath);

    const thumbnailfile = req.files?.thumbnail[0]?.path;
//     console.log(videoFileLocalPath,thumbnailfile);
//       console.log("FILES RECEIVED:", req.files);
//   console.log("BODY RECEIVED:", req.body);
    if(!videoFileLocalPath){
        throw new ApiError(400,"video file is required")
    }
     if(!thumbnailfile){
        throw new ApiError(400,"thumbnail is required")
    }
    // console.log(videoFileLocalPath);
    
    // const lengthvideo = await getVideoDurationInSeconds(videoFileLocalPath);
    const thumbnail = await uploadOnCloundinary(thumbnailfile)
    const videoFile = await uploadOnCloundinary(videoFileLocalPath)
    // console.log(thumbnail,videoFile);
    
    if(!videoFile){
        throw new ApiError(400,"videofile and thumbnail  file is required")
    }

    const videocreate = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title:title,
        description:description,
        duration:0,
        views:0,
        isPublished:true,
        owner:req.user._id
    })
        
    
    if(!videocreate){
        // console.log(createdUser,"createduser");
        throw new ApiError(500,"something went wrong while upload the video ")
        
    }
    // console.log(createdUser,"createduser");

    res.status(201).json(
        new ApiResponse(200,videocreate,"video upload  successfully")
    )

})
  
const getWatchHistory= asyncHandler(async(req,res)=>{
    console.log(req.user._id);
//     if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
//   throw new Error("Invalid user ID");
// }   

// const userId = new mongoose.Types.ObjectId(req.user._id);
// console.log(userId);

    const user = await User.aggregate([        
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
                
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    // console.log(user);
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )

})

const addToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
    console.log(req.body);
    
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
    //   const loggediNUser = await User.findById(user._id).select("-password -refreshToken")

  await User.findByIdAndUpdate(req.user._id,{ $addToSet: { watchHistory: videoId } },{ new: true })
  await Video.findByIdAndUpdate()
  res.status(200).json(
    new ApiResponse(200, null, "Video added to watch history")
  );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshaccesstoken,
    updateaccountdetails,
    getcurrentuser,
    changecurrentpassword,
    updatecoverimage,
    updateuseravatar,
getUserChannelProfile,
    getWatchHistory,
    subscribeToChannel,
    unsubscribeFromChannel,
    videouploadtochannel,
    addToWatchHistory
}