const http = require('http');

const postData = 'email=admin%40veigin.pk&password=StrongPass123';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/vg-7x2k',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Body length:', data.length);
    // Check for redirect location
    if (res.headers.location) {
      console.log('Redirect to:', res.headers.location);
    }
    // Check for set-cookie
    if (res.headers['set-cookie']) {
      console.log('Set-Cookie:', res.headers['set-cookie']);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();
