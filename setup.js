#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 QuickSum Setup Wizard');
console.log('========================\n');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  try {
    // Check if .env exists
    const envPath = path.join(__dirname, 'backend', '.env');
    if (fs.existsSync(envPath)) {
      const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        rl.close();
        return;
      }
    }

    // Get Gemini API key
    console.log('\n📋 Google Gemini API Key Setup');
    console.log('1. Go to https://makersuite.google.com/app/apikey');
    console.log('2. Create a new API key');
    console.log('3. Copy the API key\n');
    
    const apiKey = await question('Enter your Gemini API key: ');
    
    if (!apiKey || apiKey.trim() === '') {
      console.log('❌ API key is required. Setup cancelled.');
      rl.close();
      return;
    }

    // Create .env file
    const envContent = `# QuickSum Backend Environment Variables
GEMINI_API_KEY=${apiKey.trim()}
PORT=5000
NODE_ENV=development
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');

    // Install backend dependencies
    console.log('\n📦 Installing backend dependencies...');
    const { execSync } = require('child_process');
    execSync('npm install', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
    console.log('✅ Backend dependencies installed!');

    // Install extension dependencies
    console.log('\n📦 Installing extension dependencies...');
    execSync('npm install', { cwd: path.join(__dirname, 'extension'), stdio: 'inherit' });
    console.log('✅ Extension dependencies installed!');

    // Build extension
    console.log('\n🔨 Building extension...');
    execSync('npm run build', { cwd: path.join(__dirname, 'extension'), stdio: 'inherit' });
    console.log('✅ Extension built successfully!');

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend server:');
    console.log('   cd backend && npm start');
    console.log('\n2. Load the extension in Chrome:');
    console.log('   - Go to chrome://extensions/');
    console.log('   - Enable "Developer mode"');
    console.log('   - Click "Load unpacked"');
    console.log('   - Select the "extension/dist" folder');
    console.log('\n3. Start summarizing content! 🚀');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setup(); 