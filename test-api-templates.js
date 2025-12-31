// Test API Response
async function testAPI() {
  console.log('Testing /api/email/templates endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3002/api/email/templates');
    
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('\nRaw Response:', text.substring(0, 200));
    
    try {
      const json = JSON.parse(text);
      console.log('\nParsed JSON:');
      console.log('Templates count:', json.templates?.length || 0);
      if (json.templates) {
        json.templates.forEach((t, i) => {
          console.log(`${i+1}. ${t.name} (${t.category})`);
        });
      }
    } catch {
      console.log('Not valid JSON');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
