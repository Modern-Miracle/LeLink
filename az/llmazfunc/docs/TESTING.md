# Testing Guide

## Overview

The LeLink Triage Assistant includes comprehensive testing capabilities for integration testing, API testing, and end-to-end conversation flows.

## Test Structure

```
tests/
├── integration/          # Integration tests
│   ├── testLekinkBot.js # Main test suite with scenarios
│   ├── simpleLekinkTest.js # Simple HTTP endpoint test
│   └── testLekinkDirect.js # Direct API testing
├── fixtures/            # Test data and scenarios
└── utils/              # Test utilities
```

## Running Tests

### Quick Start - Automated Script (Recommended)

The easiest way to run tests is using the automated test script that handles all setup:

```bash
# Automatically starts Azure Functions, Azurite, and runs all tests
./scripts/test/test-all.sh

# Run specific number of test scenarios
./scripts/test/test-all.sh 2

# Run configuration wizard for production FHIR setup
./scripts/test/test-all.sh --wizard

# Run tests in production mode (uses Azure FHIR Service)
NODE_ENV=production ./scripts/test/test-all.sh

# Show help and all options
./scripts/test/test-all.sh --help
```

### Environment Modes

The test system supports two storage modes:

1. **Development Mode** (default)
   - Uses Azurite for local FHIR storage
   - No authentication required
   - Automatic setup

2. **Production Mode**
   - Uses Azure FHIR Service
   - Requires authentication configuration
   - Supports multiple auth methods:
     - Managed Identity (DefaultAzureCredential)
     - Service Principal
     - Bearer Token

### Production Configuration Wizard

When running tests in production mode for the first time, use the wizard:

```bash
./scripts/test/test-all.sh --wizard
```

The wizard will guide you through:
1. **FHIR Service URL**: Your Azure FHIR Service endpoint
2. **Authentication Method**:
   - **Managed Identity**: Best for Azure-hosted environments
   - **Service Principal**: For CI/CD and local testing
   - **Bearer Token**: Quick testing with pre-generated token
3. **Additional Settings**:
   - Resource validation
   - Audit logging

### Manual Testing

If you prefer to manage the setup yourself:

```bash
# First, start Azure Functions
npm start

# In another terminal, run tests
npm test

# Or run tests from the test directory
cd tests
npm test
```

### Individual Test Suites

```bash
cd tests

# Run main test suite
npm run test

# Run simple HTTP test
npm run test:simple

# Run direct API test
npm run test:direct
```

### Using Test Scripts

```bash
# Run all tests with automated setup
./scripts/test/test-all.sh

# Run specific number of scenarios
./scripts/test/test-all.sh 2
```

## Test Scenarios

The main test suite includes several medical scenarios:

1. **Chest Pain** - High-risk scenario
2. **Headache** - Medium-risk scenario
3. **Abdominal Pain** - Medium-risk scenario
4. **Minor Cut** - Low-risk scenario

Each scenario tests:
- Symptom recognition
- Risk assessment accuracy
- Resource generation
- Conversation flow

## Writing New Tests

### Test Structure Example

```javascript
// tests/integration/myNewTest.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function testNewScenario() {
    const conversationId = uuidv4();
    const patientId = uuidv4();
    
    try {
        // 1. Initial message
        const response = await axios.post('http://localhost:7071/api/symptomAssessmentBot', {
            message: "I have a fever and cough",
            patientId: patientId
        });
        
        // 2. Verify response
        console.assert(response.data.threadId, 'Should return threadId');
        console.assert(response.data.reply, 'Should return reply');
        
        // 3. Follow-up message
        const followUp = await axios.post('http://localhost:7071/api/symptomAssessmentBot', {
            message: "The fever is 102°F",
            patientId: patientId,
            threadId: response.data.threadId
        });
        
        // 4. Check resources
        if (followUp.data.resources) {
            console.log('Resources generated:', Object.keys(followUp.data.resources));
        }
        
        console.log('✅ Test passed');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testNewScenario();
```

### Adding to Test Suite

1. Create test file in `tests/integration/`
2. Add test script to `tests/package.json`:
   ```json
   {
     "scripts": {
       "test:mynew": "node integration/myNewTest.js"
     }
   }
   ```

## Test Configuration

### Environment Setup

Tests use the same configuration as the main app:
- Configuration file: `config/local.settings.json`
- Required settings:
  - `OPENAI_API_KEY`
  - `OPENAI_CONVERSATION_ASSISTANT_ID`
  - `OPENAI_ORGANIZATION_ID`

### Prerequisites

1. Azure Functions must be running:
   ```bash
   npm start
   ```

2. Valid OpenAI credentials configured

3. Node.js v20 installed

## Debugging Tests

### Enable Verbose Logging

```javascript
// In your test file
const debug = true;

if (debug) {
    console.log('Request:', JSON.stringify(requestData, null, 2));
    console.log('Response:', JSON.stringify(response.data, null, 2));
}
```

### Check Function Logs

While tests are running, monitor the Azure Functions output for detailed logs.

### Common Issues

1. **Connection Refused**
   - Ensure Azure Functions is running on port 7071
   - Check: `curl http://localhost:7071/api/symptomAssessmentBot`

2. **401 Unauthorized**
   - Verify OpenAI API key is correct
   - Check assistant ID exists

3. **Timeout Errors**
   - Increase timeout in test configuration
   - Check OpenAI API status

## Test Output

### Success Output
```
=== Starting LeLink Triage Assistant Tests ===
Testing 4 scenarios

==================================================
Testing Scenario: CHESTPAIN
==================================================
✅ Conversation completed successfully
Resources generated: 2
Risk level: high (matches expected)

Test Summary:
Total Scenarios: 4
Successful: 4
Failed: 0
```

### Failure Output
```
❌ Test failed: Request failed with status code 500
Error: Internal server error
Correlation ID: abc-123-def
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clear test data after runs
3. **Assertions**: Verify all expected outputs
4. **Error Handling**: Test error scenarios
5. **Documentation**: Comment complex test logic

## Performance Testing

For load testing, consider:
- Apache JMeter
- K6
- Custom Node.js scripts with concurrent requests

Example concurrent test:
```javascript
const promises = [];
for (let i = 0; i < 10; i++) {
    promises.push(runTest());
}
await Promise.all(promises);
```