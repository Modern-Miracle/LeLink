/**
 * Simple test for LeLink Triage Assistant Azure Function
 * This tests the HTTP endpoint directly without complex setup
 */

import axios from 'axios';

interface BotResponse {
  threadId?: string;
  reply?: string;
  resources?: {
    RiskAssessment?: any;
    Observation?: any;
  };
}

async function testLekinkEndpoint(): Promise<void> {
    console.log('=== Simple LeLink Triage Assistant Test ===\n');
    
    const url = 'http://localhost:7071/api/symptomAssessmentBot';
    const conversationId = 'test-' + Date.now();
    
    try {
        // Test 1: Initialize conversation
        console.log('1. Testing conversation initialization...');
        const initResponse = await axios.post<BotResponse>(url, {
            conversationId,
            message: 'start',
            userId: 'test-user',
            patientId: 'test-patient'
        });
        
        console.log('Response:', initResponse.data);
        console.log('✅ Initialization successful\n');
        
        // Test 2: Send a symptom message
        console.log('2. Testing symptom message...');
        const symptomResponse = await axios.post<BotResponse>(url, {
            conversationId,
            message: 'I have chest pain and difficulty breathing',
            userId: 'test-user',
            patientId: 'test-patient',
            threadId: initResponse.data.threadId
        });
        
        console.log('Response:', symptomResponse.data);
        console.log('✅ Symptom message processed\n');
        
        // Test 3: Check if resources are generated
        if (symptomResponse.data.resources) {
            console.log('3. Resources generated:');
            const resources = symptomResponse.data.resources;
            
            if (resources.RiskAssessment) {
                console.log('- RiskAssessment found');
            }
            if (resources.Observation) {
                console.log('- Observation found');
            }
            console.log('✅ Resources check complete\n');
        }
        
        console.log('All tests completed successfully!');
        
    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Check if Azure Functions is running
async function checkFunctionsRunning(): Promise<void> {
    try {
        await axios.get('http://localhost:7071/api/symptomAssessmentBot');
    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Azure Functions is not running on port 7071');
            console.log('Please start it with: func start');
            process.exit(1);
        }
    }
}

// Main
async function main(): Promise<void> {
    await checkFunctionsRunning();
    await testLekinkEndpoint();
}

main().catch(console.error);