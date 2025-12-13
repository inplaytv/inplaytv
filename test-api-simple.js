const http = require('http');

function testAPI() {
  console.log('Testing API connection...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/settings/coming-soon',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      try {
        const json = JSON.parse(data);
        console.log('Parsed JSON:', json);
      } catch (e) {
        console.log('Not valid JSON');
      }
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });

  req.setTimeout(5000, () => {
    console.log('Request timeout');
    req.destroy();
  });

  req.end();
}

testAPI();