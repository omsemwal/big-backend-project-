 import {v2 as cloudinary } from "cloudinary"
 import fs from "fs"



 cloudinary.config({ 
  cloud_name: "dy6s4gqcp",
  api_key: 578296856675496, 
  api_secret: "EB8qgNw9HdwHVgQYueIB5Dn6Ags"
});


//  CLOUDINARY_CLOUD_NAME= dy6s4gqcp
// CLOUDINARY_API_KEY =578296856675496
// CLOUDINARY_API_SECRET=EB8qgNw9HdwHVgQYueIB5Dn6Ags


 const uploadOnCloudinary=async(localFilePath)=>{
      try {
          if(!localFilePath){
            return null
          }
          //upload file in cloudinary
          const responce=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
          })
     // file has been uploaded successfull
          console.log("file  is uploaded on cloudinary", responce.url)
          return responce
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



// import {v2 as cloudinary} from "cloudinary"
// import fs from "fs"


// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET 
// });

// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) return null
//         //upload the file on cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto"
//         })
//         // file has been uploaded successfull
//         //console.log("file is uploaded on cloudinary ", response.url);
//         fs.unlinkSync(localFilePath)
//         return response;

//     } catch (error) {
//         fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
//         return null;
//     }
// }



// export {uploadOnCloudinary}