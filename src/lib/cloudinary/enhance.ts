/**
 * Cloudinary Image Enhancement
 *
 * Enhances Mission Connect photos using Cloudinary's auto-enhancement
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate an enhanced image URL using Cloudinary's fetch and transform
 * This doesn't require uploading - it fetches and transforms on-the-fly
 */
export function getEnhancedImageUrl(originalUrl: string): string {
  // If Cloudinary isn't configured, return original URL
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return originalUrl;
  }

  // Use Cloudinary's fetch feature to grab external image and apply transformations
  const transformations = [
    'f_auto',           // Auto format (webp, etc)
    'q_auto:best',      // Auto quality optimization
    'e_auto_color',     // Auto color correction
    'e_auto_brightness', // Auto brightness
    'e_auto_contrast',  // Auto contrast
    'e_improve',        // General improvement
    'e_sharpen:80',     // Sharpen slightly
  ].join(',');

  const encodedUrl = encodeURIComponent(originalUrl);

  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/${transformations}/${encodedUrl}`;
}

/**
 * Enhance multiple images
 */
export function enhanceImages(urls: string[]): string[] {
  return urls.map(url => getEnhancedImageUrl(url));
}
