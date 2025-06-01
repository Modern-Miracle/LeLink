import axios from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';

interface LocalSettings {
  Values: {
    OPENAI_API_KEY: string;
    [key: string]: string;
  };
}

async function findOrganization(): Promise<void> {
  console.log('Finding organization for API key...');
  
  try {
    // Read config from local.settings.json
    const configPath = join(__dirname, '../../local.settings.json');
    const localSettings: LocalSettings = JSON.parse(readFileSync(configPath, 'utf8'));
    const settings = localSettings.Values;

    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${settings.OPENAI_API_KEY}`
      }
    });
    
    console.log('API call successful. Check the headers...');
    console.log('Response headers:', response.headers);
    
  } catch (error: any) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
}

findOrganization().catch(console.error);