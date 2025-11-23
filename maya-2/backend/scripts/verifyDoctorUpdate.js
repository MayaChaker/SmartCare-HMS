const http = require('http');

function requestJson(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0,
        ...headers,
      },
    };
    const req = http.request(options, (res) => {
      let str = '';
      res.on('data', (chunk) => (str += chunk));
      res.on('end', () => {
        try {
          const json = str ? JSON.parse(str) : {};
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: { raw: str } });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  try {
    const login = await requestJson('POST', '/api/auth/login', { username: 'doc', password: 'doc123' });
    if (login.status !== 200) {
      console.error('Login failed:', login.body);
      process.exit(1);
    }
    const token = login.body.token;
    console.log('Logged in. Token length:', token?.length || 0);

    const update = await requestJson(
      'PUT',
      '/api/doctor/profile',
      { experience: 12 },
      { Authorization: `Bearer ${token}` }
    );
    console.log('Update status:', update.status, 'response:', update.body);

    const profile = await requestJson('GET', '/api/doctor/profile', null, { Authorization: `Bearer ${token}` });
    console.log('Profile status:', profile.status, 'experience:', profile.body?.experience);

    if (profile.status === 200 && profile.body?.experience === 12) {
      console.log('Doctor experience successfully updated to 12');
      process.exit(0);
    } else {
      console.error('Verification failed. Profile:', profile.body);
      process.exit(2);
    }
  } catch (err) {
    console.error('Error running verification:', err.message || err);
    process.exit(3);
  }
}

main();