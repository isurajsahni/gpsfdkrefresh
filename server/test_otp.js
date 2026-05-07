const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { sendPasswordlessOtp } = require('./controllers/authController');

const req = {
  body: { identifier: 'test@example.com', channel: 'email' }
};

const res = {
  status: (code) => ({
    json: (data) => console.log('Status:', code, 'Data:', data)
  }),
  json: (data) => console.log('Success:', data)
};

const next = (error) => console.error('Next called with error:', error);

sendPasswordlessOtp(req, res, next).then(() => {
  console.log('Done');
});
