fetch('http://localhost:5000/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'isurajsahni7@gmail.com' })
})
  .then(res => res.json())
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Fetch error:', err));
