/**
 * Minimal test for LeLink Triage Assistant
 */

import axios from 'axios';

interface TestData {
    message: string;
    patientId: string;
}

interface BotResponse {
    threadId?: string;
    reply?: string;
    [key: string]: any;
}

async function testLekinkMinimal(): Promise<void> {
    console.log('=== Minimal LeLink Test ===');
    
    const url = 'http://localhost:7071/api/symptomAssessmentBot';
    
    const testData: TestData = {
        message: 'start',
        patientId: '123e4567-e89b-42d3-a456-426614174000' // Valid v4 UUID
    };
    
    console.log('Request:', JSON.stringify(testData, null, 2));
    
    try {
        const response = await axios.post<BotResponse>(url, testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: () => true // Accept any status
        });
        
        console.log('\nStatus:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200) {
            console.log('\n✅ Success!');
            if (response.data.threadId) {
                console.log('Thread ID:', response.data.threadId);
            }
            if (response.data.reply) {
                console.log('Bot reply:', response.data.reply);
            }
        } else {
            console.log('\n❌ Error response');
        }
        
    } catch (error: any) {
        console.error('\n❌ Request failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Azure Functions not running on port 7071');
        }
    }
}

// Check if Azure Functions is running
async function checkRunning(): Promise<boolean> {
    try {
        await axios.get('http://localhost:7071/api/symptomAssessmentBot');
        return true;
    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Azure Functions is not running on port 7071');
            console.log('Please start with: func start');
            return false;
        }
        return true; // Other errors mean it's running
    }
}

// Main
async function main(): Promise<void> {
    if (await checkRunning()) {
        await testLekinkMinimal();
    }
}

main();