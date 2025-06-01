import axios from 'axios';

// Configuration
const baseUrl = 'http://localhost:7071';
const endpoint = '/api/symptomAssessmentBot';

interface TestScenario {
  name: string;
  message: string;
}

interface BotResponse {
  reply: string;
  threadId: string;
  resources?: { [key: string]: any };
}

// Test scenarios
const testScenarios: TestScenario[] = [
  {
    name: "Chest Pain",
    message: "I'm a 45 year old male. Sharp chest pain on the left side, shortness of breath, sweating"
  },
  {
    name: "Headache",
    message: "I'm a 28 year old female. Throbbing headache on right side, sensitivity to light, mild nausea"
  },
  {
    name: "Minor Cut",
    message: "I'm a 20 year old male. Small cut on finger from kitchen knife, minimal bleeding"
  }
];

async function runTest(scenario: TestScenario): Promise<boolean> {
  console.log(`\n=== Testing: ${scenario.name} ===`);
  console.log(`Sending: ${scenario.message}`);
  
  try {
    const response = await axios.post<BotResponse>(`${baseUrl}${endpoint}`, {
      message: scenario.message,
      patientId: `test-patient-${Date.now()}`
    });
    
    console.log(`\nBot Response: ${response.data.reply}`);
    console.log(`Thread ID: ${response.data.threadId}`);
    
    if (response.data.resources) {
      console.log(`Resources generated:`, Object.keys(response.data.resources));
    }
    
    console.log(`✅ Test passed`);
    return true;
  } catch (error: any) {
    console.error(`❌ Test failed:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
    return false;
  }
}

async function runAllTests(): Promise<void> {
  console.log("=== Starting Simple Bot Tests ===");
  console.log(`Testing endpoint: ${baseUrl}${endpoint}`);
  
  let passed = 0;
  let failed = 0;
  
  for (const scenario of testScenarios) {
    const result = await runTest(scenario);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n=== Test Summary ===");
  console.log(`Total: ${testScenarios.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
}

// Run the tests
runAllTests().catch(console.error);