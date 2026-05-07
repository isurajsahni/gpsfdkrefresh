const { sendPasswordlessOtp } = require('./controllers/authController');

const req = {
  body: { identifier: 'isurajsahni7@gmail.com', channel: 'email' }
};

const res = {
  status: (code) => ({
    json: (data) => console.log('Status:', code, 'Data:', data)
  }),
  json: (data) => console.log('Success:', data)
};

const next = (error) => {
  console.error('Next called with error:', error);
  console.log('Error status:', error.status);
  console.log('Error statusCode:', error.statusCode);
};

sendPasswordlessOtp(req, res, next).then(() => {
  console.log('Done');
});
