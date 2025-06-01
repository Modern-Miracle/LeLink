import { OpenAI } from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

interface LocalSettings {
  Values: {
    OPENAI_API_KEY: string;
    OPENAI_ORGANIZATION_ID: string;
    [key: string]: string;
  };
}

async function testOpenAI(): Promise<void> {
  console.log('Testing OpenAI configuration...');
  
  try {
    // Read config from local.settings.json
    const configPath = join(__dirname, '../../local.settings.json');
    const localSettings: LocalSettings = JSON.parse(readFileSync(configPath, 'utf8'));
    const settings = localSettings.Values;

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
      
    } catch (error: any) {
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
      
    } catch (error: any) {
      console.error('✗ Failed with org ID:', error.message);
    }
  } catch (error: any) {
    console.error('Failed to read configuration:', error.message);
  }
}

testOpenAI().catch(console.error);