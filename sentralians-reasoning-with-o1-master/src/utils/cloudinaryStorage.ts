/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export async function uploadFile(fileBuffer: Buffer, fileName: string, mimetype: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('image/') ? 'image' : 'auto';
    
    cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: fileName,
        folder: 'uploads', // Optional: organize files in folders
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(fileBuffer);
  });
}

export async function deleteFile(fileName: string): Promise<any> {
  try {
    const result = await cloudinary.uploader.destroy(`uploads/${fileName}`);
    return result;
  } catch (error) {
    throw error;
  }
}

export async function getObjectSignedUrl(key: string): Promise<string> {
  // Cloudinary URLs are public by default, return the standard URL
  const url = cloudinary.url(`uploads/${key}`, {
    secure: true,
  });
  
  return url;
}

export { cloudinary };
