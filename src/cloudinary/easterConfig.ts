import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: "dc7z01tdd",
  api_key: "724493754643247",
  api_secret: "cnyL5_Qx8b69unJv63vXhrPikPU",
  secure: true,
    //cloud_name: process.env.EASTER_CLOUDINARY_CLOUD_NAME,
    //api_key: process.env.EASTER_CLOUDINARY_API_KEY,
    //api_secret: process.env.EASTER_CLOUDINARY_API_SECRET,
    //secure: true
});

const params = {
    folder: 'Submissions',
    allowed_formats: ['jpeg', 'jpg', 'png'],
}

const storage = new CloudinaryStorage({
    cloudinary,
    params
})
export const config = { cloudinary, upload: multer({ storage }) }