const fs = require('fs');
const path = require('path');

console.log('Current working directory:', process.cwd());

const possiblePaths = [
  path.resolve(process.cwd(), '../../apps/web/public/backgrounds'),
  path.resolve(process.cwd(), '../web/public/backgrounds'),
  path.resolve(process.cwd(), '../../web/public/backgrounds'),
  path.join(process.cwd(), '../web/public/backgrounds'),
  'C:\\inplaytv - New\\apps\\web\\public\\backgrounds'
];

possiblePaths.forEach((testPath, index) => {
  console.log(`\nPath ${index + 1}: ${testPath}`);
  console.log('Exists:', fs.existsSync(testPath));
  
  if (fs.existsSync(testPath)) {
    try {
      const files = fs.readdirSync(testPath);
      console.log('Files:', files.slice(0, 5)); // First 5 files
    } catch (e) {
      console.log('Error reading directory:', e.message);
    }
  }
});