/**
 * Optimizes Cloudinary URLs by injecting transformation parameters.
 * Automatically converts massive RAW uploads into tiny WebP formats, 
 * slashing image payloads to fix rendering delays.
 * 
 * @param {string} url - The original image URL
 * @param {number} width - The maximum width to scale to
 * @returns {string} The optimized CDN URL
 */
export const optimizeImage = (url, width = 600) => {
  if (!url) return '';
  
  // Only intercept known Cloudinary raw upload URLs
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // If the image already has transformation parameters, don't double dip
    if (url.includes('/upload/v') || url.match(/\/upload\/[a-z_]+/)) {
      const parts = url.split('/upload/');
      if (parts.length === 2 && parts[1].startsWith('v')) {
        return `${parts[0]}/upload/w_${width},q_auto,f_auto/${parts[1]}`;
      }
    }
    
    // Default safe fallback interception
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},q_auto,f_auto/${parts[1]}`;
    }
  }
  
  // Return the original URL if not a standard cloudinary unoptimized upload
  return url;
};
