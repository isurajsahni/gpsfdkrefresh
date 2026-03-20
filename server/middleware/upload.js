const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Determine format from file mimetype
    const ext = file.mimetype.split('/')[1] || 'jpg';
    return {
      folder: 'gpsfdk',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4'],
      format: ext === 'jpeg' ? 'jpg' : ext
    };
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

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
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const csvUpload = multer({ 
  storage: csvDiskStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/x-csv', 'application/x-csv', 'text/comma-separated-values', 'text/x-comma-separated-values'];
    if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported. Please upload a CSV file.`), false);
    }
  }
});

module.exports = { cloudinary, upload, csvUpload };
