/**
 * Optimizes Cloudinary URLs by injecting transformation parameters.
 * - f_auto: Automatically selects the best image format (WebP/AVIF).
 * - q_auto: Automatically adjusts quality for optimal size/clarity.
 * - c_limit: Resize the image while maintaining aspect ratio, without upscaling.
 * - w_{width}: Specifies the target width.
 * 
 * @param {string} url - The original image URL
 * @param {number} width - The target width (optional)
 * @returns {string} The optimized CDN URL
 */
export const optimizeImage = (url, width) => {
  if (!url) return '';
  
  // Only intercept known Cloudinary raw upload URLs
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Avoid double transformation or transforming already optimized URLs
    if (url.includes('/f_auto') || url.includes('/q_auto')) {
      return url;
    }

    const parts = url.split('/upload/');
    if (parts.length === 2) {
      // Construct transformation string
      // Always include f_auto,q_auto
      let transform = 'f_auto,q_auto';
      
      // If width is provided, add scaling transformation
      if (width) {
        transform += `,w_${width},c_limit`;
      }
      
      // Reconstruct the URL with the transformation
      return `${parts[0]}/upload/${transform}/${parts[1]}`;
    }
  }
  
  // Return the original URL if not a standard cloudinary unoptimized upload
  return url;
};
