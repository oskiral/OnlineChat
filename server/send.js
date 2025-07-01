const http = require('http');

const data = JSON.stringify({
  user: 'oskar',
  content: 'siema, to testowa wiadomość'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  res.on('data', (chunk) => {
    process.stdout.write(chunk);
  });
});

req.on('error', (error) => {
  console.error('Błąd:', error.message);
});

req.write(data);
req.end();