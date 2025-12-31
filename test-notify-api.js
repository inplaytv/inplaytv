// Test the waitlist notify API endpoint directly
const testEmail = 'test@example.com';

async function testNotifyAPI() {
  console.log('🧪 Testing /api/waitlist/notify endpoint...\n');
  console.log(`Testing with email: ${testEmail}\n`);

  try {
    const response = await fetch('http://localhost:3002/api/waitlist/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}\n`);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Response is JSON:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('❌ Response is NOT JSON:');
      console.log(text.substring(0, 500)); // Show first 500 chars
      if (text.length > 500) {
        console.log(`\n... (${text.length - 500} more characters)`);
      }
    }
  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }
}

testNotifyAPI();
