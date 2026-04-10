const http = require('http');

// Generate a unique timestamp for test data
const timestamp = Date.now();

// Helper function to make request
function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

(async () => {
  try {
    console.log('Testing User Registration...');
    let result = await makeRequest('/api/auth/register', 'POST', {
      username: 'testuser_' + timestamp,
      email: `testuser${timestamp}@example.com`,
      password: 'TestPass123'
    });
    console.log(result);

    const loginData = {
      username: 'testuser_' + timestamp,
      email: `testuser${timestamp}@example.com`,
      password: 'TestPass123'
    };

    console.log('Testing User Login...');
    result = await makeRequest('/api/auth/login', 'POST', loginData);
    console.log(result);

    // Further tests such as upload, detect, report can be implemented here similarly.

  } catch (error) {
    console.error('Error during tests: ', error);
  }
})();
