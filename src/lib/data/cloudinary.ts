import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadProductImage(file: File): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary environment variables are not configured.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "rawnq/products", resource_type: "image" }, (error, result) => {
      if (error) reject(error);
      else if (result?.secure_url) resolve(result.secure_url);
      else reject(new Error("Cloudinary returned no image URL."));
    });
    stream.end(buffer);
  });
}

export async function uploadTransferReceipt(file: File): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary environment variables are not configured.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "rawnq/receipts", resource_type: "auto" }, (error, result) => {
      if (error) reject(error);
      else if (result?.secure_url) resolve(result.secure_url);
      else reject(new Error("Cloudinary returned no receipt URL."));
    });
    stream.end(buffer);
  });
}