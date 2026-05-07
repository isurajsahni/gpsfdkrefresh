const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { verifyPasswordlessOtp } = require('./controllers/authController');

const req = {
  body: { identifier: 'test@example.com', otp: '123456' } // assuming it fails or works
};

const res = {
  status: (code) => ({
    json: (data) => console.log('Status:', code, 'Data:', data)
  }),
  json: (data) => console.log('Success:', data)
};

const next = (error) => console.error('Next called with error:', error);

verifyPasswordlessOtp(req, res, next).then(() => {
  console.log('Done');
});
