 import {v2 as cloudinary } from "cloudinary"
 import fs from "fs"




cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});





 const uploadOnCloudinary=async(localFilePath)=>{
      try {
          if(!localFilePath){
            return null
          }
          //upload file in cloudinary
          const responce=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
          })

          
        fs.unlinkSync(localFilePath) // isse kuch hi second me public temp ke ander se apne aap file unlink ho jayegi or public/temp empty ho jayeha or file cloudiney pr upload ho jayegi
        return responce
     // file has been uploaded successfull
          // console.log("file  is uploaded on cloudinary", responce.url)
          // return responce

          
      } catch (error) {
         
        fs.unlinkSync(localFilePath)
        return null
        // // remove the locally saved temporary file as the upload operation got failed
//       
      }
 }

 const deleteOnCloudinary = async(public_id, resource_type)=>{
  if(!public_id) return null
  try {
      return await cloudinary.uploader.destroy(public_id, {
          resource_type,
      })
  } catch (error) {
      console.log(error)
      return null
  }
}


   export {uploadOnCloudinary,deleteOnCloudinary }



