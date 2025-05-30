const axios = require('axios');
const localSettings = require('../config/local.settings.json');
const settings = localSettings.Values;

async function findOrganization() {
  console.log('Finding organization for API key...');
  
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${settings.OPENAI_API_KEY}`
      }
    });
    
    console.log('API call successful. Check the headers...');
    console.log('Response headers:', response.headers);
    
  } catch (error) {
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