const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Building Tailwind CSS...');
  const tailwindBin = path.join(__dirname, 'node_modules', '.bin', 'tailwindcss');
  execSync(`"${tailwindBin}" -i ./src/index.css -o ./src/tailwind.css`, { stdio: 'inherit' });
  console.log('Tailwind CSS built successfully!');
} catch (error) {
  console.error('Error building Tailwind CSS:', error);
  process.exit(1);
} 