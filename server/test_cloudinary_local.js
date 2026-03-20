require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create a dummy 1x1 png image
const dummyImagePath = path.join(__dirname, 'dummy.png');
const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
fs.writeFileSync(dummyImagePath, pngData);

async function testUpload() {
  try {
    const res = await cloudinary.uploader.upload(dummyImagePath, {
      folder: 'gpsfdk/test'
    });
    console.log('--- CLOUDINARY RESPONSE ---');
    console.log(JSON.stringify(res, null, 2));
    
    // cleanup
    fs.unlinkSync(dummyImagePath);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testUpload();
