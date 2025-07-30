const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testBackend() {
  console.log('🧪 Testing QuickSum Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test text summarization
    console.log('2. Testing text summarization...');
    const testText = `Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. Some of the activities computers with artificial intelligence are designed for include speech recognition, learning, planning, and problem solving. AI has been used in various applications including virtual assistants, autonomous vehicles, medical diagnosis, and game playing. The field of AI research was founded on the assumption that human intelligence can be precisely described and simulated by machines.`;

    const textResponse = await axios.post(`${BASE_URL}/summarize-text`, {
      text: testText
    });

    console.log('✅ Text summarization passed!');
    console.log('Summary:', textResponse.data.summary);
    console.log('');

    console.log('🎉 All tests passed! Backend is working correctly.');
    console.log('\n📋 You can now:');
    console.log('1. Load the extension in Chrome');
    console.log('2. Start summarizing YouTube videos and web pages');
    console.log('3. Use the context menu for quick summarization');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm start');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Check your Gemini API key in the .env file');
    }
  }
}

// Run the test
testBackend(); 