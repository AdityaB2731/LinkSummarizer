const fs = require('fs');
const path = require('path');

// Create a simple PNG icon using a data URL
// This is a basic approach - in production you'd use a proper image processing library

const createPNGIcon = (size) => {
  // Create a simple colored square as a placeholder
  // In a real scenario, you'd convert the SVG to PNG
  const canvas = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background circle -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#grad1)" stroke="#fff" stroke-width="2"/>
      
      <!-- Document icon -->
      <rect x="${size*0.25}" y="${size*0.2}" width="${size*0.5}" height="${size*0.6}" rx="2" fill="#fff" opacity="0.9"/>
      
      <!-- Lines representing text -->
      <rect x="${size*0.3}" y="${size*0.3}" width="${size*0.4}" height="2" rx="1" fill="#667eea"/>
      <rect x="${size*0.3}" y="${size*0.35}" width="${size*0.35}" height="2" rx="1" fill="#667eea"/>
      <rect x="${size*0.3}" y="${size*0.4}" width="${size*0.38}" height="2" rx="1" fill="#667eea"/>
      <rect x="${size*0.3}" y="${size*0.45}" width="${size*0.32}" height="2" rx="1" fill="#667eea"/>
      <rect x="${size*0.3}" y="${size*0.5}" width="${size*0.4}" height="2" rx="1" fill="#667eea"/>
      <rect x="${size*0.3}" y="${size*0.55}" width="${size*0.3}" height="2" rx="1" fill="#667eea"/>
      
      <!-- Summary arrow -->
      <path d="M ${size*0.7} ${size*0.4} L ${size*0.8} ${size*0.5} L ${size*0.7} ${size*0.6}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M ${size*0.8} ${size*0.5} L ${size*0.7} ${size*0.5}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  return canvas;
};

// Create the public directory if it doesn't exist
const publicDir = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create icons for different sizes
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const iconContent = createPNGIcon(size);
  const iconPath = path.join(publicDir, `icon${size}.svg`);
  fs.writeFileSync(iconPath, iconContent);
  console.log(`Created icon${size}.svg`);
});

console.log('Icons created successfully!');
console.log('Note: These are SVG files. For production, you should convert them to PNG using an image processing tool.'); 