require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return { folder: 'gpsfdk/test', allowed_formats: ['png'] };
  },
});

const upload = multer({ storage });

const app = express();

app.post('/test', upload.array('images', 2), (req, res) => {
  fs.writeFileSync('result.json', JSON.stringify(req.files, null, 2));
  console.log('Saved to result.json');
  res.json(req.files);
});

const server = app.listen(5001, async () => {
  // Create test file
  fs.writeFileSync('test.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));

  const FormData = require('form-data');
  const form = new FormData();
  form.append('images', fs.createReadStream('test.png'));

  try {
    const response = await fetch('http://localhost:5001/test', {
      method: 'POST',
      body: form
    });
    console.log(await response.json());
  } catch(e) { console.error('request failed', e); }

  server.close();
  process.exit(0);
});
