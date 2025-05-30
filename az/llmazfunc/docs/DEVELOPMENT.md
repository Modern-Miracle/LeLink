# Development Guide

## Development Setup

### Prerequisites

- Node.js v20.x (use nvm for version management - automatically handled by startup scripts)
- Azure Functions Core Tools v4
- Docker (optional, for running Azurite separately)
- VS Code (recommended) with extensions:
  - Azure Functions
  - ESLint
  - Prettier

### Quick Start

```bash
# From the backend root directory
./setup-wizard.sh      # Configure environment
./startup-live.sh      # Start with live logs
./run-testbot.sh       # Test the system

# Or start services manually
cd az/llmazfunc
npm install
npm run dev           # Development mode with Azurite
```

### Development vs Production Modes

```bash
# Development Mode (default)
npm run dev
# - Uses Azurite for FHIR storage (local blob storage)
# - Connects to local Hardhat blockchain
# - Shows detailed logs

# Production Mode
npm run prod
# - Uses Azure FHIR Service
# - Connects to mainnet/testnet blockchain
# - Requires FHIR_SERVER_URL and bearer token
```

## Code Structure

### Directory Organization

```
src/
├── functions/           # Azure Function entry points
│   └── symptomAssessmentBot/
│       ├── index.js    # Main HTTP trigger
│       └── function.json
├── assistants/         # Assistant logic
│   └── lekainkTriageAssistant.js
├── services/          # External services
│   ├── openai.js      # OpenAI API wrapper
│   ├── blockchain.js  # Blockchain integration
│   └── fhirStorage.js # FHIR storage (Azurite/FHIR Service)
└── utils/            # Utilities
    ├── config.js     # Configuration with env support
    ├── constants.js
    ├── errors.js
    └── logger.js
```

### Key Components

#### 1. Function Entry Point (`index.js`)
- Handles HTTP requests
- Validates input
- Manages error responses
- Logs triage interactions and blockchain activity
- Shows FHIR storage results

#### 2. Assistant (`lekainkTriageAssistant.js`)
- Manages conversation flow
- Interfaces with OpenAI
- Handles tool functions
- Formats FHIR resources
- Integrates blockchain logging
- Stores resources in Azurite/FHIR Service

#### 3. Services Layer

**OpenAI Service (`openai.js`)**
- Wraps OpenAI API calls
- Manages threads and messages
- Handles tool function execution
- Implements retry logic

**Blockchain Service (`blockchain.js`)**
- Hashes FHIR resources (SHA-256)
- Connects to smart contract
- Creates audit trail
- Manages transactions

**FHIR Storage Service (`fhirStorage.js`)**
- Dual-mode storage support
- Azurite blob storage (dev)
- Azure FHIR Service (prod)
- Patient resource queries

## Coding Standards

### JavaScript Style Guide

- ES6+ features preferred
- Async/await over promises
- Descriptive variable names
- JSDoc comments for functions

```javascript
/**
 * Process a patient message and return triage assessment
 * @param {string} message - Patient's symptom description
 * @param {string} threadId - Conversation thread ID
 * @param {string} patientId - Patient identifier
 * @returns {Promise<Object>} Triage response with resources
 */
async function processMessage(message, threadId, patientId) {
    // Implementation
}
```

### Error Handling

Always use custom error types:

```javascript
const { ValidationError, SafetyError } = require('./utils/errors');

// Validation error
if (!message) {
    throw new ValidationError('Message is required');
}

// Safety check
if (containsUnsafeContent(message)) {
    throw new SafetyError('Message contains inappropriate content');
}
```

### Logging

Use structured logging with real-time display:

```javascript
const { Logger } = require('./utils/logger');
const logger = new Logger({ correlationId });

// Info level
logger.info('Processing message', { 
    patientId, 
    messageLength: message.length 
});

// Console output for real-time monitoring
console.log('🏥 === TRIAGE INTERACTION ===');
console.log(`📥 Patient Message: "${message}"`);
console.log(`🤖 Bot Reply: "${reply}"`);

// Blockchain logging
console.log('🔗 === BLOCKCHAIN LOGGING ===');
console.log(`📍 Network: ${network}`);
console.log(`📄 Contract: ${contractAddress}`);

// FHIR storage
console.log('💾 === FHIR STORAGE ===');
console.log(`📦 Mode: ${storageMode}`);
```

## Adding New Features

### 1. New Tool Function

To add a new tool function to the assistant:

```javascript
// In lekainkTriageAssistant.js
const runResult = await this.openAI.waitForRunCompletion(threadId, run.id, {
    toolHandlers: {
        createRiskAssessment: async (args) => { /* existing */ },
        createObservation: async (args) => { /* existing */ },
        // Add new tool handler
        createCarePlan: async (args) => {
            this.logger.info('Creating CarePlan', { args });
            this.toolCalls.set('CarePlan', args);
            return { success: true };
        }
    }
});
```

### 2. New Storage Integration

Add to the processing flow:

```javascript
// After generating resources
if (response.resources.CarePlan) {
    // Store in FHIR storage
    const storageResult = await fhirStorageService.storeResource(
        response.resources.CarePlan
    );
    
    // Log hash to blockchain
    const blockchainResult = await blockchainService.logResources(
        [response.resources.CarePlan], 
        patientId
    );
}
```

### 3. Environment-Specific Features

```javascript
// Use config for environment-specific behavior
const config = require('./utils/config');

if (config.fhirStorage.mode === 'azurite') {
    // Development-specific code
    console.log('Using local Azurite storage');
} else {
    // Production-specific code
    console.log('Using Azure FHIR Service');
}
```

## Testing During Development

### Using the Test Bot

```bash
# Run all test scenarios
./run-testbot.sh

# Run specific scenario
./run-testbot.sh -t chest-pain

# Run multiple scenarios
./run-testbot.sh -s 10

# Skip FHIR export
./run-testbot.sh --no-export
```

### Manual Testing

```bash
# Test with curl
curl -X POST http://localhost:7071/api/symptomAssessmentBot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have chest pain",
    "patientId": "test-123"
  }'
```

### Integration Testing

```javascript
// tests/integration/fhirStorage.test.js
test('FHIR resources are stored in Azurite', async () => {
    const response = await axios.post(API_URL, {
        message: 'Test symptoms',
        patientId: 'test-patient'
    });
    
    expect(response.data.fhirStorage).toBeDefined();
    expect(response.data.fhirStorage.mode).toBe('azurite');
    expect(response.data.fhirStorage.success).toBe(true);
});
```

## Debugging

### Local Debugging with Live Logs

```bash
# Use startup-live.sh for real-time logs
./startup-live.sh

# Output shows:
# [Hardhat] - Blockchain activity
# [Azure] - Function execution
# 🏥 Triage interactions
# 🔗 Blockchain transactions
# 💾 FHIR storage operations
```

### VS Code Launch Configuration

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach to Node Functions",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "preLaunchTask": "func: host start"
        }
    ]
}
```

### Common Issues

1. **Azurite Connection Issues**
   - Ensure Azurite is running (started by test scripts)
   - Check port 10000 is available
   - Verify connection string in config

2. **Blockchain Connection Failed**
   - Ensure Hardhat node is running
   - Check contract address in .env
   - Verify network configuration

3. **FHIR Storage Errors**
   - Check storage mode (dev/prod)
   - Verify Azure credentials for production
   - Ensure blob container permissions

## Performance Optimization

### Concurrent Operations

```javascript
// Process blockchain and FHIR storage in parallel
const [blockchainResult, storageResult] = await Promise.all([
    blockchainService.logResources(resources, patientId),
    fhirStorageService.storeResource(resource)
]);
```

### Caching Configuration

```javascript
// Cache config values to avoid repeated env reads
const configCache = new Map();

function getCachedConfig(key) {
    if (configCache.has(key)) return configCache.get(key);
    const value = config.get(key);
    configCache.set(key, value);
    return value;
}
```

## Security Considerations

### Environment Variables

```bash
# Required for development
OPENAI_API_KEY=sk-...
OPENAI_CONVERSATION_ASSISTANT_ID=asst_...
OPENAI_ORGANIZATION_ID=org-...
ENABLE_BLOCKCHAIN_LOGGING=true
ENABLE_FHIR_STORAGE=true

# Required for production
FHIR_SERVER_URL=https://...
FHIR_SERVER_BEARER_TOKEN=...
```

### Data Privacy

- Only resource hashes stored on blockchain
- Actual medical data in secure storage
- Patient IDs anonymized in blockchain
- No PHI in logs

## Monitoring & Observability

### Real-time Monitoring

```bash
# Watch logs in separate terminals
tail -f logs/azure-functions.log
tail -f logs/hardhat-node.log

# Or use startup-live.sh for combined view
```

### Structured Logging

```javascript
// All logs include correlation ID
logger.info('Operation completed', {
    correlationId,
    duration: Date.now() - startTime,
    resourceCount: resources.length,
    storageMode: config.fhirStorage.mode
});
```

## Deployment Preparation

### Environment Checks

```javascript
// Add startup checks
async function validateEnvironment() {
    // Check OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY required');
    }
    
    // Check storage configuration
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.FHIR_SERVER_URL) {
            throw new Error('FHIR_SERVER_URL required in production');
        }
    }
    
    // Test connections
    await blockchainService.initialize();
    await fhirStorageService.initialize();
}
```

### Build Scripts

```json
// package.json
{
  "scripts": {
    "build": "npm run lint && npm test",
    "lint": "eslint src/**/*.js",
    "test": "jest",
    "dev": "NODE_ENV=development func start",
    "prod": "NODE_ENV=production func start"
  }
}
```

## Resources

- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [FHIR Specification](https://www.hl7.org/fhir/)
- [Azurite Documentation](https://github.com/Azure/Azurite)
- [Hardhat Documentation](https://hardhat.org/docs)