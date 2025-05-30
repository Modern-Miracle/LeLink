const { OpenAI } = require('openai');
const localSettings = require('../config/local.settings.json');
const settings = localSettings.Values;

async function testOpenAI() {
  console.log('Testing OpenAI configuration...');
  console.log('API Key (first 10 chars):', settings.OPENAI_API_KEY.substring(0, 10) + '...');
  console.log('Organization ID:', settings.OPENAI_ORGANIZATION_ID);
  
  try {
    // Test direct API without org ID first
    const openaiNoOrg = new OpenAI({
      apiKey: settings.OPENAI_API_KEY
    });
    
    console.log('\nTesting without organization ID...');
    const response1 = await openaiNoOrg.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello" }],
      max_tokens: 10
    });
    console.log('✓ Success without org ID');
    
  } catch (error) {
    console.error('✗ Failed without org ID:', error.message);
  }
  
  try {
    // Test with org ID
    const openaiWithOrg = new OpenAI({
      apiKey: settings.OPENAI_API_KEY,
      organization: settings.OPENAI_ORGANIZATION_ID
    });
    
    console.log('\nTesting with organization ID...');
    const response2 = await openaiWithOrg.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello" }],
      max_tokens: 10
    });
    console.log('✓ Success with org ID');
    
  } catch (error) {
    console.error('✗ Failed with org ID:', error.message);
  }
}

testOpenAI().catch(console.error);