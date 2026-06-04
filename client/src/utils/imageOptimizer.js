export const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
  '<rect width="400" height="400" fill="#f3f4f6"/>' +
  '<text x="200" y="200" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="14" fill="#9ca3af">Image unavailable</text>' +
  '</svg>'
);

export const handleImageError = (e) => {
  if (e.target.src !== PLACEHOLDER_IMAGE) {
    e.target.src = PLACEHOLDER_IMAGE;
  }
};

/**
 * Optimizes Cloudinary URLs by injecting transformation parameters.
 * Filters out unreachable localhost URLs that were saved during development.
 */
export const optimizeImage = (url, width) => {
  if (!url) return '';

  // Block localhost/dev-only URLs that will never load in production
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
    return PLACEHOLDER_IMAGE;
  }

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
