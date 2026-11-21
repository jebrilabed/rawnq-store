import type { ImageLoaderProps } from "next/image";

/**
 * Transforms a Cloudinary URL to leverage Cloudinary's native CDN transformations:
 * - f_auto: Automatically delivers the most efficient format (AVIF / WebP) based on client browser support.
 * - q_auto: Automatically optimizes compression quality without visible artifacts.
 * - w_${width},c_limit: Scales down to requested display width without upscaling.
 *
 * For Cloudinary assets, this completely offloads image transformations and cache writes
 * from Vercel to Cloudinary's global CDN, eliminating Vercel Image Optimization usage.
 * For local assets, it delegates to Next.js's default image optimization.
 */
export function formatCloudinaryUrl(
  url: string,
  { width, quality }: { width?: number; quality?: number } = {}
): string {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const uploadIndex = url.indexOf("/image/upload/");
  if (uploadIndex === -1) return url;

  const prefix = url.slice(0, uploadIndex + "/image/upload/".length);
  let rest = url.slice(uploadIndex + "/image/upload/".length);

  // Build Cloudinary transformation parameters
  const transforms: string[] = ["f_auto"];
  if (quality) {
    transforms.push(`q_${quality}`);
  } else {
    transforms.push("q_auto");
  }

  if (width) {
    transforms.push(`w_${width}`);
    transforms.push("c_limit");
  }

  // Strip any existing transformations (e.g. f_auto,q_auto/ or w_640/) before the public ID
  const existingTransformMatch = rest.match(/^([a-z]_[a-z0-9_:,]+(\/[a-z]_[a-z0-9_:,]+)*\/)/i);
  if (existingTransformMatch) {
    rest = rest.slice(existingTransformMatch[0].length);
  }

  return `${prefix}${transforms.join(",")}/${rest}`;
}

export function isCloudinaryUrl(url: unknown): url is string {
  return typeof url === "string" && url.includes("res.cloudinary.com");
}

export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (isCloudinaryUrl(src)) {
    return formatCloudinaryUrl(src, { width, quality });
  }
  // Fallback to Next.js default image endpoint for local assets
  const q = quality || 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
