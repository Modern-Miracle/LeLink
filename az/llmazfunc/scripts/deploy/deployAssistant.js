const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Function to read the assistant configuration
function getAssistantConfig() {
  return {
    name: "Medical Symptom Assessment Bot",
    description: "Conducts medical symptom assessments and generates FHIR resources",
    model: "gpt-4o-mini",
    instructions: `You are the LeLink Triage Assistant, a medical triage bot that helps assess patient symptoms and generate FHIR-compliant medical resources.

Your responsibilities:
1. Conduct a medical triage conversation with the patient
2. Gather symptoms systematically using appropriate medical frameworks
3. Assess risk levels based on the information provided
4. Generate two FHIR resources after completing the assessment:
   - RiskAssessment: Documenting the risk level and rationale
   - Observation: Capturing the key findings from the conversation

Guidelines:
- Be thorough but efficient in gathering information
- Ask targeted questions based on the presenting complaint
- Always check for red flag symptoms first
- Maintain a professional and empathetic tone
- Complete the conversation before generating resources
- Use appropriate medical terminology in the FHIR resources

Completion Protocol:
1. After gathering all required information, ALWAYS ask:
   "I've collected information about [summarize key points]. Before we conclude, is there anything else you'd like to add?"

2. WAIT for patient's response:
   - If they add information → Continue gathering details
   - If they say "no" or confirm nothing to add → MUST call 1) createRiskAssessment, then 2) createObservation and finally after calling those functions MUST call 3)conversationStatusCheck function with {isComplete: true}
   - If they're unsure → Summarize what you've gathered and ask again

3. Function Usage:
   - ONLY call conversationStatusCheck when patient explicitly confirms no more information and createRiskAssessment() and createObservation() function was called before
   - ALWAYS set isComplete to true when calling the function
   - Example: After patient says "No, that's everything" → call conversationStatusCheck({isComplete: true}) and answer him "Thanks, I will now proceed."

Emergency Protocol:
If at any point patient reports:
- Severe chest pain
- Difficulty breathing
- Severe head injury
- Loss of consciousness
- Or similar symptoms and situations that could indicate an emergency situation:
→ Immediately advise seeking emergency care and do NOT mark as complete

Always ensure the resources are FHIR-compliant and contain all required fields.`,
    tools: [
      {
        type: "function",
        function: {
          name: "updateRiskAssessmentResource",
          description: "Updates the risk assessment resource based on patient symptoms",
          parameters: {
            type: "object",
            properties: {
              risk: {
                type: "string",
                enum: ["low", "medium", "high", "emergency"],
                description: "The assessed risk level"
              },
              rationale: {
                type: "string",
                description: "Explanation for the risk assessment"
              }
            },
            required: ["risk", "rationale"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "updateEncounterResource",
          description: "Updates the encounter resource with conversation details",
          parameters: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled"],
                description: "The encounter status"
              },
              reasonText: {
                type: "string",
                description: "Reason for the encounter"
              }
            },
            required: ["status", "reasonText"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "createObservationResource",
          description: "Creates an observation resource for a symptom",
          parameters: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "SNOMED CT or LOINC code for the observation"
              },
              display: {
                type: "string",
                description: "Human-readable name of the observation"
              },
              value: {
                type: "string",
                description: "Value of the observation"
              },
              unit: {
                type: "string",
                description: "Unit of measurement (if applicable)"
              }
            },
            required: ["code", "display", "value"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "getConversationContext",
          description: "Gets the current conversation context",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ]
  };
}

// Function to create or update the assistant
async function deployAssistant(apiKey) {
  const client = new OpenAI({ apiKey });
  
  try {
    // Check if we have a stored assistant ID
    const configPath = path.join(__dirname, '.assistant-config.json');
    let assistantId = null;
    
    if (fs.existsSync(configPath)) {
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assistantId = savedConfig.assistantId;
      
      // Try to retrieve the existing assistant
      try {
        const existingAssistant = await client.beta.assistants.retrieve(assistantId);
        console.log(`Found existing assistant: ${existingAssistant.id}`);
        
        // Update the existing assistant
        const assistantConfig = getAssistantConfig();
        const updatedAssistant = await client.beta.assistants.update(assistantId, assistantConfig);
        console.log(`Updated assistant: ${updatedAssistant.id}`);
        return updatedAssistant.id;
      } catch (error) {
        console.log('Existing assistant not found, creating new one...');
        assistantId = null;
      }
    }
    
    // Create a new assistant
    const assistantConfig = getAssistantConfig();
    const assistant = await client.beta.assistants.create(assistantConfig);
    console.log(`Created new assistant: ${assistant.id}`);
    
    // Save the assistant ID
    fs.writeFileSync(configPath, JSON.stringify({ assistantId: assistant.id }, null, 2));
    
    return assistant.id;
  } catch (error) {
    console.error('Error deploying assistant:', error);
    throw error;
  }
}

// Function to update local.settings.json
function updateSettings(assistantId) {
  const settingsPath = path.join(__dirname, 'local.settings.json');
  
  let settings;
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } else {
    settings = {
      IsEncrypted: false,
      Values: {
        AzureWebJobsStorage: "UseDevelopmentStorage=true",
        FUNCTIONS_WORKER_RUNTIME: "node"
      }
    };
  }
  
  // Update the assistant ID
  settings.Values.OPENAI_CONVERSATION_ASSISTANT_ID = assistantId;
  
  // Write back the updated settings
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('Updated local.settings.json with assistant ID');
}

// Main deployment function
async function deploy() {
  console.log('Deploying Medical Symptom Assessment Assistant...');
  
  // Check for API key in environment or settings
  let apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    const settingsPath = path.join(__dirname, 'local.settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      apiKey = settings.Values.OPENAI_API_KEY;
    }
  }
  
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY not found in environment or local.settings.json');
    process.exit(1);
  }
  
  try {
    // Deploy the assistant
    const assistantId = await deployAssistant(apiKey);
    
    // Update local settings
    updateSettings(assistantId);
    
    console.log('\n✅ Deployment successful!');
    console.log(`Assistant ID: ${assistantId}`);
    console.log('\nYou can now run the Azure Function with this assistant.');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment if called directly
if (require.main === module) {
  deploy();
}

module.exports = { deploy, getAssistantConfig };