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
});

req.write(postData);
req.end();
