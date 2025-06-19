import {v2 as cloudinary } from "cloudinary"
import fs from "fs"



cloudinary.config({
  cloud_name: process.env.CLOUNDINARY_CLOUD_NAME,
  api_key: process.env.CLOUNDINARY_API_KEY,
  api_secret: process.env.CLOUNDINARY_API_SECRET
});


const uploadOnCloundinary= async (localFilePath) =>{
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log(localFilePath);
        
        // console.log(response,"cloundiary file response",response.url);
        
        // console.log("file is uploaded on cloundiary",response.url);
        fs.unlinkSync(localFilePath)
        console.log(response);
        
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}



// const uploadOnCloundinaryvideo = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null; 
//     console.log(localFilePath);
    
//     // Upload the video
//     const response = await cloudinary.v2.uploader.upload(localFilePath, {
//       resource_type: "video",
//     });

//     // Delete local file after successful upload
//     fs.unlinkSync(localFilePath);

//     // Optional: console log response
//     console.log("Uploaded to Cloudinary:", response);

//     return response;
//   } catch (error) {
//     // Always try to delete local file, even on failure
//     if (fs.existsSync(localFilePath)) {
//       fs.unlinkSync(localFilePath);
//     }

//     console.error("Cloudinary video upload failed:", error);
//     return null;
//   }
// };


// cloudinary.v2.uploader
// .upload("dog.mp4", 
//   { resource_type: "video", 
//     public_id: "dog_closeup",
//     eager: [
//       { width: 300, height: 300, crop: "pad", audio_codec: "none" }, 
//       { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" } ],                                   
//     eager_async: true,
//     eager_notification_url: "https://mysite.example.com/notify_endpoint" })
// .then(result=>console.log(result));
// cloudinary.v2.uploader.destroy(public_id, options).then(callback);
export {uploadOnCloundinary}