const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { OpenAI } = require('openai');

// Load settings from local.settings.json
const localSettings = require('../../config/local.settings.json');
const settings = localSettings.Values;

// Test scenarios for LeLink Triage Assistant
const triageScenarios = {
  chestPain: {
    condition: "Acute Chest Pain",
    age: 45,
    gender: "male",
    symptoms: "Sharp chest pain on the left side, shortness of breath, sweating",
    duration: "Started 30 minutes ago",
    severity: "8/10 pain scale",
    medicalHistory: "Hypertension, high cholesterol",
    medications: "Atorvastatin 20mg daily, lisinopril 10mg daily",
    expectedRisk: "high", // Expected risk level
    expectedResources: ["RiskAssessment", "Observation"]
  },
  headache: {
    condition: "Severe Headache",
    age: 28,
    gender: "female",
    symptoms: "Throbbing headache on right side, sensitivity to light, mild nausea",
    duration: "Started 3 hours ago",
    severity: "7/10 pain scale",
    medicalHistory: "History of migraines",
    medications: "None currently",
    expectedRisk: "medium",
    expectedResources: ["RiskAssessment", "Observation"]
  },
  abdominalPain: {
    condition: "Abdominal Pain",
    age: 35,
    gender: "female",
    symptoms: "Lower right abdominal pain, no fever, mild nausea",
    duration: "Started yesterday",
    severity: "5/10 pain scale",
    medicalHistory: "No significant history",
    medications: "None",
    expectedRisk: "medium",
    expectedResources: ["RiskAssessment", "Observation"]
  },
  minorCut: {
    condition: "Minor Cut",
    age: 20,
    gender: "male",
    symptoms: "Small cut on finger from kitchen knife, minimal bleeding",
    duration: "Just happened",
    severity: "2/10 pain scale",
    medicalHistory: "Healthy",
    medications: "None",
    expectedRisk: "low",
    expectedResources: ["RiskAssessment", "Observation"]
  }
};

class LekinkTester {
  constructor() {
    this.baseUrl = 'http://localhost:7071';
    this.endpoint = '/api/symptomAssessmentBot';
    this.testOutputDir = path.join(__dirname, 'lekink-test-results');
    this.currentConversation = null;
    this.openai = new OpenAI({
      apiKey: settings.OPENAI_API_KEY
    });
  }

  async init() {
    await fs.mkdir(this.testOutputDir, { recursive: true });
  }

  async startNewConversation(scenario) {
    const patientId = uuidv4();
    this.currentConversation = {
      patientId,
      scenario: scenario.condition,
      messages: [],
      startTime: new Date().toISOString(),
      resources: []
    };

    console.log('\n=== Starting New Triage Conversation ===');
    console.log(`Patient ID: ${patientId}`);
    console.log(`Scenario: ${scenario.condition}`);
    console.log(`Expected Risk: ${scenario.expectedRisk}`);
    console.log(`\n`);
    
    // Initial message presenting the chief complaint
    const initialMessage = `I'm a ${scenario.age} year old ${scenario.gender}. ${scenario.symptoms}`;
    console.log(`[Patient-Bot] → Sending: ${initialMessage}`);
    return this.sendMessage(initialMessage);
  }

  async sendMessage(message) {
    try {
      // Message is already logged by the generatePatientResponse method
      
      const payload = {
        message,
        patientId: this.currentConversation.patientId,
        threadId: this.currentConversation.threadId
      };
      
      console.log(`[Thread Debug] Using threadId: ${this.currentConversation.threadId || 'none'}`);
      
      const response = await axios.post(`${this.baseUrl}${this.endpoint}`, payload, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;
      
      if (result.threadId) {
        this.currentConversation.threadId = result.threadId;
        console.log(`[Thread Debug] Received threadId: ${result.threadId}`);
      }
      
      // Check for duplicate responses - look at the actual content
      if (this.currentConversation.messages.length > 0) {
        const lastMessage = this.currentConversation.messages[this.currentConversation.messages.length-1];
        const isDuplicate = lastMessage.received?.reply === result.reply;
        
        if (isDuplicate) {
          console.warn('⚠️ WARNING: Bot sent duplicate response!');
          
          // Add to duplicate counter for repeated messages
          this.duplicateResponseCount = (this.duplicateResponseCount || 0) + 1;
          
          if (this.duplicateResponseCount >= 2) {
            console.error('❌ ERROR: Bot is in a response loop, sending identical messages.');
            this.loopDetected = true;
          }
        } else {
          // Reset counter when a unique response is received
          this.duplicateResponseCount = 0;
        }
      }
      
      this.currentConversation.messages.push({
        sent: message,
        received: result,
        timestamp: new Date().toISOString()
      });

      console.log('[LeLink-Bot] ← Response:', result.reply);
      
      if (result.resources) {
        console.log('\n=== FHIR Resources Generated ===');
        if (result.resources.RiskAssessment) {
          const risk = result.resources.RiskAssessment;
          console.log('RiskAssessment:');
          console.log(`- Status: ${risk.status}`);
          console.log(`- Risk Level: ${risk.prediction?.[0]?.qualitativeRisk?.coding?.[0]?.display || 'Not specified'}`);
          console.log(`- Rationale: ${risk.prediction?.[0]?.rationale || 'Not provided'}`);
          this.currentConversation.resources.push(risk);
        }
        if (result.resources.Observation) {
          const obs = result.resources.Observation;
          console.log('\nObservation:');
          console.log(`- Status: ${obs.status}`);
          console.log(`- Code: ${obs.code?.text || obs.code?.coding?.[0]?.display}`);
          console.log(`- Value: ${obs.valueString || 'Complex value'}`);
          this.currentConversation.resources.push(obs);
        }
      }

      // Track the last 3 bot responses to detect loops
      if (!this.responseHistory) {
        this.responseHistory = [];
      }

      this.responseHistory.push(result.reply);
      if (this.responseHistory.length > 3) {
        this.responseHistory.shift();
      }

      // Check for response loops (same response 3 times in a row)
      if (this.responseHistory.length === 3 && 
          this.responseHistory[0] === this.responseHistory[1] &&
          this.responseHistory[1] === this.responseHistory[2]) {
        console.error('\n❌ ERROR: Bot appears to be stuck in a response loop!');
        console.log(`[Thread Debug] Current threadId: ${this.currentConversation.threadId || 'none'}`);
      }

      return result;
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
      throw error;
    }
  }

  async generatePatientResponse(scenario, botQuestion) {
    // Track previous bot questions to detect repetition
    if (!this.previousBotQuestions) {
      this.previousBotQuestions = [];
    }
    
    // Track conversation message count to help conclude conversation
    const messageCount = this.currentConversation.messages.length;
    
    // Detect if the bot is asking for a conversation conclusion or summarizing
    const isConversationEndingQuestion = 
      (botQuestion.includes("Before we conclude") || 
       botQuestion.includes("anything else you'd like to add") ||
       botQuestion.includes("thank you for sharing") ||
       botQuestion.includes("based on what you've told me") ||
       botQuestion.includes("I've collected all the information")) &&
      messageCount > 3; // At least a few exchanges to ensure proper assessment
    
    // Detect if the bot is repeating questions
    const isDuplicateQuestion = this.previousBotQuestions.includes(botQuestion);
    if (isDuplicateQuestion) {
      console.warn('\n⚠️ WARNING: Bot is repeating questions!');
    }
    
    this.previousBotQuestions.push(botQuestion);
    if (this.previousBotQuestions.length > 5) {
      this.previousBotQuestions.shift();
    }

    // Create a context with special handling for conversation termination
    let context = `You are simulating a patient with the following condition: ${scenario.condition}
    Age: ${scenario.age}, Gender: ${scenario.gender}
    Symptoms: ${scenario.symptoms}
    Duration: ${scenario.duration}
    Severity: ${scenario.severity}
    Medical History: ${scenario.medicalHistory}
    Current Medications: ${scenario.medications}
    
    ${isDuplicateQuestion ? 'IMPORTANT: The healthcare provider has already asked this question or a very similar one. Politely indicate this is repetitive and mention you already answered this question before.' : ''}
    
    IMPORTANT: DO NOT ECHO OR REPEAT THE HEALTHCARE PROVIDER'S EXACT MESSAGE. Respond as a patient would, with details about your symptoms and condition.
    Respond naturally to the healthcare provider's question. Be concise and realistic.
    Do not repeat information you've already provided.
    ALWAYS respond as the patient, never act as if you are the healthcare provider.`;
    
    // Add special instructions for conversation ending
    if (isConversationEndingQuestion) {
      context += `
      
      IMPORTANT: The healthcare provider appears to be concluding the conversation. 
      Respond with "No, that's all. Thank you for your help." or a similar closing statement.
      Keep your response brief and clearly indicate you have no more information to add.
      This will help the conversation conclude naturally.`;
      
      console.log('[Patient-Sim Debug] Detected conversation ending question');
    }
    
    // Detect if the bot is providing safety advice or emergency guidance
    const isSafetyGuidance = 
      (botQuestion.includes("emergency") || 
       botQuestion.includes("call 911") ||
       botQuestion.includes("go to the hospital") ||
       botQuestion.includes("seek immediate medical attention") ||
       botQuestion.includes("emergency department") ||
       botQuestion.includes("urgent care"));
       
    // Force the conversation to end after a maximum number of turns (reduced from 8 to 6)
    if (messageCount >= 6) {
      context += `
      
      IMPORTANT: This conversation has gone on for a while.
      Regardless of what the provider is asking, respond with something like:
      "I think I've told you everything. Thank you for your help and advice." 
      to help conclude the conversation.`;
      
      console.log('[Patient-Sim Debug] Forcing conversation conclusion due to max turns');
    }
    
    // Add special handling for emergency/safety guidance
    if (isSafetyGuidance) {
      context += `
      
      IMPORTANT: The healthcare provider is giving safety or emergency guidance.
      Acknowledge their advice with something like:
      "I understand. I'll follow your advice right away. Thank you for your help."
      Keep your response brief to help end the conversation.`;
      
      console.log('[Patient-Sim Debug] Detected safety/emergency guidance');
    }

    try {
      // Build conversation history with CORRECT role mapping for patient simulation
      // In this case, we need to REVERSE the roles to avoid role confusion:
      // - The system is instructing the model to ACT AS the PATIENT
      // - The LeLink bot messages should be "user" role (healthcare provider asking questions) 
      // - The patient's messages should be "assistant" role (the responses the model provided)
      const messages = [
        { role: "system", content: context }
      ];
      
      // Add conversation history with REVERSED roles compared to LeLink bot
      // We'll reconstruct the conversation in the correct order for the patient simulator
      // First message is always from the patient (no bot prompt yet)
      if (this.currentConversation.messages.length > 0) {
        messages.push({
          role: "assistant",
          content: this.currentConversation.messages[0].sent
        });
      }
      
      // For subsequent messages, add bot response (user) followed by patient response (assistant)
      for (let i = 0; i < this.currentConversation.messages.length - 1; i++) {
        // Bot response to the previous patient message
        if (this.currentConversation.messages[i].received && 
            this.currentConversation.messages[i].received.reply) {
          messages.push({
            role: "user",
            content: this.currentConversation.messages[i].received.reply
          });
          
          // Patient's next message in response to the bot
          messages.push({
            role: "assistant",
            content: this.currentConversation.messages[i+1].sent
          });
        }
      }
      
      // Add current question as "user" role (healthcare provider asking a new question)
      messages.push({ role: "user", content: botQuestion });
      
      console.log(`[Patient-Sim Debug] Processing with ${messages.length} messages in context`);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      });

      let patientResponse = response.choices[0].message.content;
      
      // Safety check - only detect actual echoing where the patient repeats the bot's message
      // This is a real problem with AI chat models sometimes
      if (patientResponse.length > 50 && botQuestion.length > 50) {
        // Calculate similarity only for longer messages to avoid false positives on short replies
        const similarity = this.stringSimilarity(patientResponse, botQuestion);
        
        if (similarity > 0.7) {
          console.log(`[Debug] Echo detection: similarity=${similarity.toFixed(2)} between patient response and bot message`);
          
          // Use a different response based on the conversation stage
          const responseIndex = this.currentConversation.messages.length % 4;
          let fallbackResponse;
          
          switch (responseIndex) {
            case 0:
              fallbackResponse = `The pain started about ${scenario.duration}. It's a ${scenario.severity} pain. ${scenario.symptoms}. I have a history of ${scenario.medicalHistory} and I'm taking ${scenario.medications}.`;
              break;
            case 1:
              fallbackResponse = `I understand the concern. The pain is ${scenario.severity.includes('/10') ? scenario.severity : 'severe'} and ${scenario.symptoms}. I need to know if I should go to the hospital right away.`;
              break;
            case 2:
              fallbackResponse = `Yes, I think I should seek emergency care. The symptoms are quite severe, and I'm worried it might be serious. The pain is ${scenario.symptoms} and I also have ${scenario.medicalHistory}.`;
              break;
            case 3:
              fallbackResponse = `Thank you for your advice. I'll call emergency services right away. Just to confirm, these symptoms (${scenario.symptoms}) could indicate something serious, especially with my history of ${scenario.medicalHistory}?`;
              break;
            default:
              fallbackResponse = `I've been experiencing ${scenario.symptoms} for ${scenario.duration}. My pain level is ${scenario.severity}. Can you tell me what might be causing this?`;
          }
          
          console.log(`[Patient-Bot] → Sending: ${fallbackResponse} [⚠️ AI echo prevented]`);
          return fallbackResponse;
        }
      }
      
      // Log the final patient response
      console.log(`[Patient-Bot] → Sending: ${patientResponse}`);
      
      // If the bot keeps repeating the same question, have the simulated patient
      // point out the repetition more explicitly or try to force the conversation forward
      if (isDuplicateQuestion && this.previousBotQuestions.filter(q => q === botQuestion).length > 2) {
        const repetitionResponse = `I've already answered this question multiple times. As I mentioned, ${scenario.symptoms}. Please help me understand what I should do about my condition.`;
        console.log(`[Patient-Bot] → Sending: ${repetitionResponse} [⚠️ repetition detected]`);
        return repetitionResponse;
      }

      return patientResponse;
    } catch (error) {
      console.error('[Patient-Sim Error] Error generating response:', error);
      throw error;
    }
  }
  
  // Add a simple string similarity function to detect echoes
  stringSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    
    // Convert to lowercase and remove punctuation for comparison
    const clean1 = s1.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const clean2 = s2.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    // Get the shorter and longer string
    const shorter = clean1.length < clean2.length ? clean1 : clean2;
    const longer = clean1.length >= clean2.length ? clean1 : clean2;
    
    // Calculate similarity
    if (shorter.length === 0) return 0;
    
    // Count matching words
    const words1 = shorter.split(/\s+/);
    const words2 = longer.split(/\s+/);
    let matches = 0;
    
    for (const word of words1) {
      if (words2.includes(word)) {
        matches++;
      }
    }
    
    return matches / words1.length;
  }

  async runConversation(scenarioName, maxTurns = 7) {
    const scenario = triageScenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    try {
      console.log('\n=== Thread Management Debug ===');
      console.log('[Thread Debug] Starting conversation with no threadId');
      
      let result = await this.startNewConversation(scenario);
      
      console.log(`[Thread Debug] Received threadId: ${result.threadId || 'none'}`);
      console.log('=== End Thread Debug ===\n');
      
      let turns = 0;
      let lastRepeatedResponse = null;
      let repeatedResponseCount = 0;
      
      // Keep track of time to enforce a maximum conversation duration
      const startTime = Date.now();
      const maxDuration = 120000; // 2 minutes max for a test conversation
      
      while (turns < maxTurns) {
        // Check for conversation completion from the bot
        if (result.completionStatus?.isComplete === true) {
          console.log('\n✅ Conversation marked as complete by the bot via conversationStatusCheck.');
          break;
        }
        
        // Check for timeout to avoid hanging tests
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > maxDuration) {
          console.warn(`\n⚠️ WARNING: Conversation exceeded maximum duration of ${maxDuration / 1000} seconds. Stopping.`);
          break;
        }
        
        // Check if a response loop was detected in the sendMessage method
        if (this.loopDetected) {
          console.error('\n❌ ERROR: Response loop detected. Breaking conversation.');
          console.log(`[Thread Debug] Current threadId: ${this.currentConversation.threadId || 'none'}`);
          break;
        }
        
        // Check for conversation conclusion keywords in bot's message
        const isEmergencyGuidance = 
          (result.reply.includes("emergency") && 
           (result.reply.includes("call 911") || 
            result.reply.includes("hospital") ||
            result.reply.includes("urgent care") ||
            result.reply.includes("ambulance") ||
            result.reply.includes("emergency department")));
            
        const isConversationComplete = 
          (result.reply.includes("Based on the information you've provided") && 
           result.reply.includes("recommend")) ||
          isEmergencyGuidance ||
          (turns >= 5 && result.reply.includes("thank you for sharing"));
        
        // For emergency scenarios, END IMMEDIATELY with just one response
        if (isEmergencyGuidance) {
          console.log('\n✅ EMERGENCY GUIDANCE DETECTED. Sending one final response and ending conversation.');
          
          // One final response from the patient to acknowledge the emergency guidance
          const emergencyResponse = "I understand this is serious. I'll call 911 right away. Thank you.";
          await this.sendMessage(emergencyResponse);
          console.log('\n✅ Emergency scenario completed. Terminating conversation.');
          break;
        }
        // For other conclusion types
        else if (isConversationComplete && turns >= 3) {
          console.log('\n✅ Detected natural conversation endpoint. Concluding conversation.');
          
          // One final response from the patient to acknowledge the conclusion
          const finalResponse = "Thank you for your help and advice. I'll follow your recommendations.";
          await this.sendMessage(finalResponse);
          break;
        }
        
        // Generate patient response to bot's question
        const patientResponse = await this.generatePatientResponse(scenario, result.reply);
        
        // Check if the patient's response is a conversation ender
        const isPatientEnding = 
          (patientResponse.includes("that's all") && patientResponse.includes("thank you")) ||
          (patientResponse.includes("I understand") && patientResponse.includes("follow your advice")) ||
          (patientResponse.includes("told you everything") && patientResponse.includes("thank you"));
          
        // Send patient's response
        result = await this.sendMessage(patientResponse);
        turns++;
        
        // If patient signaled end of conversation, END IMMEDIATELY
        if (isPatientEnding) {
          console.log('\n✅ Patient signaled conversation end. Terminating conversation.');
          break;
        }
        
        // For emergency scenarios, check if resources were generated 
        // (even without conversationStatusCheck, which is appropriate for emergencies)
        if (scenario.expectedRisk === 'high' || scenario.expectedRisk === 'emergency') {
          const hasResources = result.resources?.RiskAssessment && result.resources?.Observation;
          if (hasResources) {
            console.log('\n✅ Emergency scenario with resources generated. Ending conversation appropriately.');
            break;
          }
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Collect all resources before analysis and saving
      this.collectAllResources();
      
      // Analyze results
      await this.analyzeResults(scenario);
      
      // Save conversation and export FHIR resources
      const outputDir = await this.saveConversation(scenarioName);
      console.log(`\n✅ FHIR resources exported to ${outputDir}/resources/`);
      
      return {
        success: true,
        scenario: scenarioName,
        resourcesGenerated: this.currentConversation.resources.length,
        turns: turns
      };
    } catch (error) {
      console.error('Conversation failed:', error);
      return {
        success: false,
        scenario: scenarioName,
        error: error.message
      };
    }
  }

  // Collect all resources from the conversation messages
  collectAllResources() {
    // Start with the resources we've already collected
    const allResources = [...this.currentConversation.resources];
    const resourceIds = new Set(allResources.map(r => r.id));
    
    // Scan through all messages for any resources we might have missed
    for (const msg of this.currentConversation.messages) {
      if (msg.received && msg.received.resources) {
        for (const [resourceType, resource] of Object.entries(msg.received.resources)) {
          // Only add if we don't already have this resource
          if (resource.id && !resourceIds.has(resource.id)) {
            allResources.push(resource);
            resourceIds.add(resource.id);
            console.log(`Found additional resource: ${resourceType} (${resource.id})`);
          }
        }
      }
    }
    
    // Update our conversation resources with the complete set
    this.currentConversation.resources = allResources;
    return allResources;
  }

  async analyzeResults(scenario) {
    console.log('\n=== Test Analysis ===');
    
    // Collect all resources before analysis
    this.collectAllResources();
    
    // Check if expected resources were generated
    const generatedTypes = this.currentConversation.resources.map(r => r.resourceType);
    const hasRiskAssessment = generatedTypes.includes('RiskAssessment');
    const hasObservation = generatedTypes.includes('Observation');
    
    console.log(`Expected Resources: ${scenario.expectedResources.join(', ')}`);
    console.log(`Generated Resources: ${generatedTypes.join(', ')}`);
    console.log(`Total Resource Count: ${this.currentConversation.resources.length}`);
    console.log(`RiskAssessment Generated: ${hasRiskAssessment ? '✅' : '❌'}`);
    console.log(`Observation Generated: ${hasObservation ? '✅' : '❌'}`);
    
    // Check risk level if RiskAssessment was generated
    if (hasRiskAssessment) {
      const riskAssessment = this.currentConversation.resources.find(r => r.resourceType === 'RiskAssessment');
      const actualRisk = riskAssessment.prediction?.[0]?.qualitativeRisk?.coding?.[0]?.code || 'unknown';
      console.log(`\nExpected Risk Level: ${scenario.expectedRisk}`);
      console.log(`Actual Risk Level: ${actualRisk}`);
      console.log(`Risk Match: ${actualRisk === scenario.expectedRisk ? '✅' : '❌'}`);
    }
  }

  async saveConversation(scenarioName) {
    const timestamp = Date.now();
    const outputDir = path.join(this.testOutputDir, `${scenarioName}-${timestamp}`);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Create resources directory for FHIR JSON files
    const resourcesDir = path.join(outputDir, 'resources');
    await fs.mkdir(resourcesDir, { recursive: true });
    
    // Save conversation
    const conversationFile = path.join(outputDir, 'conversation.json');
    await fs.writeFile(conversationFile, JSON.stringify(this.currentConversation, null, 2));
    
    // Save each resource as an individual JSON file in the resources directory
    if (this.currentConversation.resources && this.currentConversation.resources.length > 0) {
      console.log('\n=== Exporting FHIR Resources ===');
      
      for (const resource of this.currentConversation.resources) {
        const resourceType = resource.resourceType;
        const resourceId = resource.id || `unknown-id-${Date.now()}`;
        const filename = `${resourceType}-${resourceId}.json`;
        const filePath = path.join(resourcesDir, filename);
        
        await fs.writeFile(filePath, JSON.stringify(resource, null, 2));
        console.log(`✅ Exported ${resourceType} to ${filename}`);
      }
    }
    
    // Save summary
    const summary = {
      scenario: scenarioName,
      timestamp: new Date().toISOString(),
      patientId: this.currentConversation.patientId,
      threadId: this.currentConversation.threadId,
      messageCount: this.currentConversation.messages.length,
      resourcesGenerated: this.currentConversation.resources.map(r => ({
        type: r.resourceType,
        id: r.id,
        status: r.status,
        filePath: `resources/${r.resourceType}-${r.id || 'unknown-id'}.json`
      }))
    };
    
    const summaryFile = path.join(outputDir, 'summary.json');
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n✅ Test results saved to ${outputDir}`);
    
    return outputDir;
  }
}

// Import the resource exporter
const { exportResources } = require('./exportResources');

// Main test runner
async function runTests() {
  const tester = new LekinkTester();
  await tester.init();
  
  const scenarios = Object.keys(triageScenarios);
  const results = [];
  
  console.log(`\n=== Starting LeLink Triage Assistant Tests ===`);
  console.log(`Testing ${scenarios.length} scenarios\n`);
  
  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing Scenario: ${scenario.toUpperCase()}`);
    console.log('='.repeat(50));
    
    const result = await tester.runConversation(scenario);
    results.push(result);
    
    // Add delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Total Scenarios: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
}

// Export resources from all existing test results
async function exportAllResources(testResultsDir) {
  const testDir = testResultsDir || path.join(__dirname, 'lekink-test-results');
  
  try {
    console.log(`\n=== Exporting Resources from All Test Results ===`);
    console.log(`Looking in: ${testDir}`);
    
    // Get all test result directories
    const dirs = await fs.readdir(testDir);
    const testDirs = [];
    
    for (const dir of dirs) {
      const dirPath = path.join(testDir, dir);
      const stat = await fs.stat(dirPath);
      
      if (stat.isDirectory()) {
        // Check if this is a test result directory (contains conversation.json)
        try {
          await fs.access(path.join(dirPath, 'conversation.json'));
          testDirs.push(dirPath);
        } catch (e) {
          // Not a test result directory, skip
        }
      }
    }
    
    console.log(`Found ${testDirs.length} test result directories`);
    
    // Export resources from each directory
    for (const dir of testDirs) {
      await exportResources(dir);
    }
    
    console.log(`\n=== Bulk Export Complete ===`);
    console.log(`Processed ${testDirs.length} test result directories`);
  } catch (error) {
    console.error(`Error exporting all resources: ${error.message}`);
  }
}

// Run if called directly
if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--export-all')) {
    // Export resources from all test results
    exportAllResources().catch(console.error);
  } else if (args.includes('--export')) {
    // Export resources from a specific directory
    const dirIndex = args.indexOf('--export') + 1;
    const targetDir = args[dirIndex];
    
    if (!targetDir) {
      console.error('Error: Please provide a directory path after --export');
      process.exit(1);
    }
    
    exportResources(targetDir).catch(console.error);
  } else {
    // Run tests
    runTests().catch(console.error);
  }
}

module.exports = { LekinkTester, exportResources, exportAllResources };