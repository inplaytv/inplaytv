console.log('Testing direct image access...');

const http = require('http');

function testImageAccess() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/backgrounds/golf-course-teal.jpg',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Image status: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    
    if (res.statusCode === 200) {
      console.log('✓ Image is accessible!');
    } else {
      console.log('✗ Image is NOT accessible');
    }
  });

  req.on('error', (err) => {
    console.error('Image test error:', err.message);
  });

  req.setTimeout(5000, () => {
    console.log('Image test timeout');
    req.destroy();
  });

  req.end();
}

testImageAccess();