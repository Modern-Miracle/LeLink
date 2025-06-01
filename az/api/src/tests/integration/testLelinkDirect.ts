/**
 * Direct test for LeLink Triage Assistant without full Azure Functions setup
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface TestMessage {
    conversationId: string;
    message: string;
    userId: string;
    patientId: string;
    threadId?: string;
}

interface BotResponse {
    threadId?: string;
    responseMessage?: string;
    error?: string;
    requiresCompletion?: boolean;
    resources?: {
        RiskAssessment?: {
            status: string;
            prediction?: Array<{
                outcome?: { text: string };
                qualitativeRisk?: { coding?: Array<{ code: string }> };
            }>;
        };
        Observation?: {
            status: string;
            code?: { text: string };
            valueString?: string;
        };
    };
}

interface Scenario {
    name: string;
    messages: string[];
}

// Test conversation scenarios
const scenarios: { [key: string]: Scenario } = {
    'chest-pain': {
        name: 'Chest Pain Case',
        messages: [
            'I have been having chest pain for the last 2 hours',
            'It feels like pressure on my chest, maybe 6/10 pain',
            'I also feel a bit short of breath',
            'No, I don\'t have any heart conditions, but my father had a heart attack at 60',
            'I\'m 45 years old, male',
            'No medications currently, no allergies'
        ]
    },
    'headache': {
        name: 'Headache Case',
        messages: [
            'I have a really bad headache',
            'It started this morning, getting worse',
            'The pain is on the right side of my head, throbbing',
            'About 7/10 pain level',
            'No, no vision changes or weakness',
            'I occasionally get migraines, maybe once a month'
        ]
    }
};

async function runTest(scenarioKey: string): Promise<void> {
    const scenario = scenarios[scenarioKey];
    const conversationId = uuidv4();
    
    console.log(`\n=== Testing ${scenario.name} ===`);
    console.log(`Conversation ID: ${conversationId}\n`);
    
    const baseUrl = 'http://localhost:7071/api/symptomAssessmentBot';
    
    try {
        // Initialize conversation
        console.log('Initializing conversation...');
        let response = await axios.post<BotResponse>(baseUrl, {
            conversationId,
            message: 'start',
            userId: 'test-user',
            patientId: 'test-patient'
        });
        
        if (response.data.error) {
            throw new Error(response.data.error);
        }
        
        console.log(`Bot: ${response.data.responseMessage}\n`);
        
        // Run through scenario messages
        for (const message of scenario.messages) {
            console.log(`Patient: ${message}`);
            
            const payload: TestMessage = {
                conversationId,
                message,
                userId: 'test-user',
                patientId: 'test-patient'
            };

            if (response.data.threadId) {
                payload.threadId = response.data.threadId;
            }

            response = await axios.post<BotResponse>(baseUrl, payload);
            
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            
            console.log(`Bot: ${response.data.responseMessage}\n`);
            
            // Check if conversation is complete
            if (response.data.requiresCompletion) {
                console.log('Assessment complete. Resources generated:');
                
                if (response.data.resources) {
                    const { RiskAssessment, Observation } = response.data.resources;
                    
                    if (RiskAssessment) {
                        console.log('\nRiskAssessment:');
                        console.log(`- Status: ${RiskAssessment.status}`);
                        console.log(`- Outcome: ${RiskAssessment.prediction?.[0]?.outcome?.text || 'N/A'}`);
                        console.log(`- Probability: ${RiskAssessment.prediction?.[0]?.qualitativeRisk?.coding?.[0]?.code || 'N/A'}`);
                    }
                    
                    if (Observation) {
                        console.log('\nObservation:');
                        console.log(`- Status: ${Observation.status}`);
                        console.log(`- Code: ${Observation.code?.text || 'N/A'}`);
                        console.log(`- Value: ${Observation.valueString || 'N/A'}`);
                    }
                }
                break;
            }
            
            // Add delay between messages
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n✅ Test completed successfully');
        
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Main execution
async function main(): Promise<void> {
    console.log('=== LeLink Triage Assistant Direct Test ===');
    console.log('Make sure Azure Functions is running on port 7071\n');
    
    const args = process.argv.slice(2);
    const scenarioKey = args[0] || 'chest-pain';
    
    if (!scenarios[scenarioKey]) {
        console.error(`Unknown scenario: ${scenarioKey}`);
        console.log('Available scenarios:', Object.keys(scenarios).join(', '));
        process.exit(1);
    }
    
    await runTest(scenarioKey);
}

main().catch(console.error);