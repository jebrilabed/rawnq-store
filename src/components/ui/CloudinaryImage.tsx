"use client";

import Image, { type ImageProps } from "next/image";
import { cloudinaryLoader } from "@/lib/image-loader";

/**
 * Drop-in replacement for next/image that automatically attaches cloudinaryLoader
 * inside a Client Component context.
 *
 * This prevents the React Server Component serialization error:
 * "Functions cannot be passed directly to Client Components".
 */
export function CloudinaryImage({ alt, ...props }: ImageProps) {
  const isCloudinary = typeof props.src === "string" && props.src.includes("res.cloudinary.com");
  return (
    <Image
      alt={alt ?? ""}
      {...props}
      loader={isCloudinary ? cloudinaryLoader : props.loader}
    />
  );
}

export default CloudinaryImage;
