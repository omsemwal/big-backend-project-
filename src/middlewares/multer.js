import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      return  cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null,`${Date.now()},-${file.originalname}`)
    }
  })
     
export const upload = multer({ 
    storage, 
   // any: true
})


// // Multer configuration
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "./public/temp");
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname);
//     }
// });

// const fileFilter = (req, file, cb) => {
//     // Check if the file field names match your form
//     if (file.fieldname === "avtar" || file.fieldname === "coverImage") {
//         cb(null, true);
//     } else {
//         cb(new Error("Unexpected field"), false);
//     }
// };

// export const upload = multer({
//     storage,
//     fileFilter,
// });