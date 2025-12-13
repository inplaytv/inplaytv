async function testBrowserView() {
  try {
    console.log('Testing localhost:3000/?preview=coming-soon');
    
    const response = await fetch('http://localhost:3000/?preview=coming-soon');
    const html = await response.text();
    
    // Look for background image in the HTML
    if (html.includes('golf-course-teal.jpg')) {
      console.log('✓ Background image found in HTML');
    } else {
      console.log('✗ Background image NOT found in HTML');
    }
    
    // Look for the React component
    if (html.includes('backgroundImage')) {
      console.log('✓ backgroundImage prop found in HTML');
    } else {
      console.log('✗ backgroundImage prop NOT found in HTML');
    }
    
    // Check if API is called
    console.log('\nTesting API directly...');
    const apiResponse = await fetch('http://localhost:3000/api/settings/coming-soon');
    const apiData = await apiResponse.json();
    
    console.log('API Response:', apiData);
    console.log('Background Image from API:', apiData.backgroundImage);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBrowserView();