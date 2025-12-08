/**
 * Test Gemini API Key and list available models
 */

const API_KEY = process.env.VITE_GEMINI_API_KEY || 'AIzaSyB9zlT3HRzRPDLadXmO_-zZSrPKkCAalBE';

async function testApiKey() {
  console.log('Testing Gemini API Key...');
  console.log('API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');
  
  // List available models
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    console.log('\n1. Listing available models...');
    const listResponse = await fetch(listUrl);
    const listData = await listResponse.json();
    
    if (listData.error) {
      console.error('❌ Error listing models:', listData.error.message);
      console.log('\nThis usually means:');
      console.log('  - The API key is invalid');
      console.log('  - The Generative Language API is not enabled');
      console.log('  - The API key has restrictions that block this request');
      return;
    }
    
    console.log('✅ API Key is valid!');
    console.log('\nAvailable models for generateContent:');
    
    const generateModels = listData.models?.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    ) || [];
    
    generateModels.forEach(m => {
      console.log(`  - ${m.name.replace('models/', '')}`);
    });
    
    if (generateModels.length === 0) {
      console.log('  (No models available for generateContent)');
    }
    
    // Try a simple generation with the first available model
    if (generateModels.length > 0) {
      const modelName = generateModels[0].name.replace('models/', '');
      console.log(`\n2. Testing generation with ${modelName}...`);
      
      const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
      const genResponse = await fetch(genUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hello' }] }]
        })
      });
      
      const genData = await genResponse.json();
      
      if (genData.error) {
        console.error('❌ Generation failed:', genData.error.message);
      } else {
        console.log('✅ Generation successful!');
        console.log('Response:', genData.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100));
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testApiKey();
