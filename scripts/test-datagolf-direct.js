// Quick test of DataGolf API
const apiKey = 'ac7793fb5f617626ccc418008832';

async function testDataGolf() {
  console.log('🧪 Testing DataGolf API...\n');
  
  const url = `https://feeds.datagolf.com/field-updates?tour=euro&file_format=json&key=${apiKey}`;
  console.log('Fetching:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('\n✅ Response received!');
    console.log('Event:', data.event_name);
    console.log('Field length:', data.field?.length || 0);
    console.log('Keys in response:', Object.keys(data));
    
    if (data.field && data.field.length > 0) {
      console.log('\n👤 First player:');
      console.log(JSON.stringify(data.field[0], null, 2));
      
      console.log('\n👤 Second player:');
      console.log(JSON.stringify(data.field[1], null, 2));
    }
    
    console.log('\n📊 Summary:');
    console.log('- Total players:', data.field?.length || 0);
    console.log('- Has field array:', Array.isArray(data.field));
    console.log('- Response status:', response.status);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDataGolf();
