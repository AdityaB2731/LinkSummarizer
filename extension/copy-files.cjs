const fs = require('fs');
const path = require('path');

// Files that need to be copied to dist folder
const filesToCopy = [
  'manifest.json',
  'content.js',
  'background.js'
];

console.log('📁 Copying files to dist folder...');

filesToCopy.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const destPath = path.join(__dirname, 'dist', file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`❌ File not found: ${file}`);
  }
});

console.log('🎉 All files copied successfully!'); 