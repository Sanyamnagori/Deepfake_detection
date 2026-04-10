const http = require('http');
const fs = require('fs');
const path = require('path');

const timestamp = Date.now();

function makeRequest(path, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    let options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({statusCode: res.statusCode, headers: res.headers, body});
      });
    });

    req.on('error', (e) => reject(e));

    if (data) req.write(data);
    req.end();
  });
}

// Function to upload a file using multipart/form-data
function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
      }
    };

    const fileName = path.basename(filePath);
    const fileStream = fs.readFileSync(filePath);

    let postData = '';
    postData += `--${boundary}\r\n`;
    postData += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
    postData += 'Content-Type: application/octet-stream\r\n\r\n';

    const endBoundary = `\r\n--${boundary}--\r\n`;

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({statusCode: res.statusCode, headers: res.headers, body});
      });
    });

    req.on('error', (e) => reject(e));

    req.write(postData);
    req.write(fileStream);
    req.end(endBoundary);
  });
}

(async () => {
  try {
    // Registration
    console.log('Testing User Registration...');
    const regData = JSON.stringify({
      username: 'testuser_' + timestamp,
      email: `testuser${timestamp}@example.com`,
      password: 'TestPass123'
    });
    let result = await makeRequest('/api/auth/register', 'POST', regData);
    console.log('Registration response:', result);

    // Login
    console.log('Testing User Login...');
    const loginData = JSON.stringify({
      username: 'testuser_' + timestamp,
      password: 'TestPass123'
    });
    result = await makeRequest('/api/auth/login', 'POST', loginData);
    console.log('Login response:', result);

    if (result.statusCode !== 200) {
      console.log('Login failed, aborting further tests.');
      return;
    }

    const responseBody = JSON.parse(result.body);
    const token = responseBody.data.token;
    const authHeader = {'Authorization': 'Bearer ' + token};

    // Upload a test image file (make sure a sample file exists)
    console.log('Testing File Upload...');
    const filePath = path.join(__dirname, 'uploads', 'test_image.jpg'); // Ensure this file exists or change path
    result = await uploadFile(filePath);
    console.log('Upload response:', result);

    // TODO: Add detection, report download, other endpoint tests with token auth as needed

  } catch (err) {
    console.error('Test script error:', err);
  }
})();
