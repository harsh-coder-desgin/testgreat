import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
// export const verifyJWT = asyncHandler(async(req, _, next) => {

export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // console.log("Token:", token);

        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
        
        const decodedtoken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedtoken?._id).select("-password -refreshToken")
    
    
        if(!user){
            // console.log("Token:", token);
            throw new ApiError(401,"invaild access token here")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError( 401,"Invaild access token")
    }
})