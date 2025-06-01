import { readFileSync } from 'fs';
import { join } from 'path';

// Load config manually
const configPath = join(__dirname, '../../local.settings.json');
const localSettings = JSON.parse(readFileSync(configPath, 'utf8'));
const settings = localSettings.Values;

// Set environment variables
Object.assign(process.env, settings);

import { openaiService } from '../services/openai';
import { Logger } from '../utils/logger';

async function checkAssistant() {
  const logger = new Logger();
  const assistantId = process.env.OPENAI_CONVERSATION_ASSISTANT_ID;
  
  if (!assistantId) {
    console.error('OPENAI_CONVERSATION_ASSISTANT_ID not set');
    return;
  }
  
  console.log(`Checking assistant: ${assistantId}`);
  
  try {
    // List all assistants to see what's available
    console.log('\n=== Available Assistants ===');
    const assistants = await openaiService.listAssistants();
    console.log('Available assistants:', assistants.map(a => ({
      id: a.id,
      name: a.name,
      model: a.model
    })));
    
    // Check if our target assistant exists
    const targetAssistant = assistants.find(a => a.id === assistantId);
    if (!targetAssistant) {
      console.error(`\n❌ Assistant ${assistantId} not found!`);
      console.log('Available assistant IDs:', assistants.map(a => a.id));
      return;
    }
    
    console.log(`\n✅ Found target assistant:`, targetAssistant);
    
    // Test a simple conversation
    console.log('\n=== Testing Conversation ===');
    const thread = await openaiService.createThread();
    console.log(`Created thread: ${thread.id}`);
    
    // Add message
    const message = await openaiService.createMessage(thread.id, {
      role: 'user',
      content: 'I am sick'
    });
    console.log(`Added message: ${message.id}`);
    
    // Run assistant
    const run = await openaiService.runAssistant(thread.id, assistantId);
    console.log(`Started run: ${run.id}`);
    
    // Process the run and wait for completion
    console.log(`Run initial status: ${run.status}`);
    const result = await openaiService.processRun(thread.id, run);
    console.log(`Run completed with status: ${result.status}`);
    
    if (result.status === 'completed') {
      // Get messages
      const messages = await openaiService.getMessages(thread.id);
      const assistantMessage = messages.data.find(m => m.role === 'assistant');
      
      if (assistantMessage && assistantMessage.content[0]?.type === 'text') {
        console.log('\n=== Assistant Response ===');
        console.log(assistantMessage.content[0].text.value);
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

checkAssistant().catch(console.error);