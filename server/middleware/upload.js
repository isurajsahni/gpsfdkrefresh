const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000, // 120 second timeout for Cloudinary API calls
});

// Allowed image MIME types only (no mp4 or other executables)
const allowedImageMimeTypes = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif'
];

// Video MIME types allowed ONLY on the admin product-media upload (mediaUpload
// below). Kept separate from images so the public/guest image endpoints and the
// avatar endpoint stay image-only — a video must never be accepted there.
const allowedVideoMimeTypes = ['video/mp4'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Validate MIME type server-side
    if (!allowedImageMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed. Only JPEG, PNG, WebP, and GIF are accepted.`);
    }
    const ext = file.mimetype.split('/')[1] || 'jpg';
    return {
      folder: 'gpsfdk',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      format: ext === 'jpeg' ? 'jpg' : ext
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file (increased to match frontend limit)
  fileFilter: (req, file, cb) => {
    if (allowedImageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

// Local storage for CSV import
const csvDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    // Defence in depth against path traversal. multer resolves the value we
    // return here with path.join(destination, filename), so any '../' that
    // survives into it walks out of uploads/ - and because the timestamp
    // prefix absorbs exactly one '..' segment, '../../../evil.js' lands in the
    // server's CWD, i.e. overwriting application .js files (RCE on restart).
    //
    // Today that is not reachable: multer is configured without preservePath,
    // so busboy already runs basename() on the wire filename before we ever
    // see it (verified against multer 2.2.0 / busboy 1.6.0). But that
    // containment is an undocumented default in a transitive dependency - one
    // `preservePath: true` or one parser swap and the hole is live. Sanitise
    // here so correctness does not depend on it.
    //
    // basename() strips any directory component; the character allowlist then
    // removes what is left (path separators, ':' which would create an NTFS
    // alternate data stream on Windows, control chars). Only the on-disk temp
    // name is affected - importProducts reads req.file.path and never looks at
    // the original name, so mangling here breaks nothing.
    const safeName = path.basename(file.originalname || '').replace(/[^\w.\-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const csvUpload = multer({ 
  storage: csvDiskStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max for CSV
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/x-csv', 'application/x-csv', 'text/comma-separated-values', 'text/x-comma-separated-values'];
    if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported. Please upload a CSV file.`), false);
    }
  }
});

// Avatar-specific Cloudinary storage (smaller, auto-cropped)
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (!allowedImageMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed. Only JPEG, PNG, WebP, and GIF are accepted.`);
    }
    const ext = file.mimetype.split('/')[1] || 'jpg';
    return {
      folder: 'gpsfdk-avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      format: ext === 'jpeg' ? 'jpg' : ext,
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    };
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max for avatars
  fileFilter: (req, file, cb) => {
    if (allowedImageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

// Admin product-media upload — accepts the same images as `upload`, PLUS mp4
// video (stored on Cloudinary with resource_type 'video'). Used only on the
// admin-protected POST /api/upload route so product reels can be attached to
// Product.videos. The 10 MB cap is unchanged (existing reels are 1.3–4.3 MB).
const mediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = allowedImageMimeTypes.includes(file.mimetype);
    const isVideo = allowedVideoMimeTypes.includes(file.mimetype);
    if (!isImage && !isVideo) {
      throw new Error(`File type ${file.mimetype} not allowed. Only JPEG, PNG, WebP, GIF images and MP4 video are accepted.`);
    }
    if (isVideo) {
      return {
        folder: 'gpsfdk',
        resource_type: 'video',
        allowed_formats: ['mp4'],
        format: 'mp4',
      };
    }
    const ext = file.mimetype.split('/')[1] || 'jpg';
    return {
      folder: 'gpsfdk',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      format: ext === 'jpeg' ? 'jpg' : ext,
    };
  },
});

const mediaUpload = multer({
  storage: mediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file (images and mp4)
  fileFilter: (req, file, cb) => {
    if (allowedImageMimeTypes.includes(file.mimetype) || allowedVideoMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

module.exports = { cloudinary, upload, csvUpload, avatarUpload, mediaUpload };
