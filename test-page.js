console.log('Testing tournaments page...');

async function testPage() {
  try {
    const response = await fetch('http://localhost:3003/tournaments');
    const html = await response.text();
    
    console.log('Page loads:', response.status === 200 ? 'YES' : 'NO');
    console.log('HTML length:', html.length);
    console.log('Contains "slider":', html.includes('slider') || html.includes('Slider'));
    console.log('Contains "card":', html.includes('card') || html.includes('Card'));
    console.log('Contains CSS module class:', html.includes('tournaments_') || html.includes('styles_'));
    
    // Check for specific elements
    if (html.includes('carouselSection') || html.includes('sliderSlide')) {
      console.log('✓ Slider HTML present');
    } else {
      console.log('✗ Slider HTML missing');
    }
    
    if (html.includes('featuredCompetitionCard') || html.includes('competitionCard')) {
      console.log('✓ Card HTML present');
    } else {
      console.log('✗ Card HTML missing');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPage();
