const { execSync } = require('child_process');

console.log('Building Tailwind CSS...');
try {
  execSync('npm run build:tailwind', { stdio: 'inherit' });
  console.log('Tailwind CSS built successfully!');
} catch (error) {
  console.error('Error building Tailwind CSS:', error);
  process.exit(1);
}

console.log('Starting the React application...');
try {
  execSync('npm start', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting React application:', error);
  process.exit(1);
} 