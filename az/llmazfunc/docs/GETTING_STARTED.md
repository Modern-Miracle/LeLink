# Getting Started Guide

This guide will help you set up and run the LeLink Triage Assistant on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js v20.x** (Required for Azure Functions compatibility)
  ```bash
  # Check your version
  node --version
  
  # Install via nvm (recommended)
  nvm install 20.18.1
  nvm use 20.18.1
  ```

- **Azure Functions Core Tools v4**
  ```bash
  # Install via npm
  npm install -g azure-functions-core-tools@4
  
  # Verify installation
  func --version
  ```

- **Git** (for cloning the repository)

## Step 1: Clone the Repository

```bash
git clone [repository-url]
cd leveaBotHttpv4
```

## Step 2: Install Dependencies

```bash
# Install main project dependencies
npm install

# Install test dependencies
cd tests && npm install && cd ..
```

## Step 3: Configure Environment

### Create Configuration File

```bash
# Create local settings from example
cp config/local.settings.json.example config/local.settings.json
```

If no example exists, create `config/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "OPENAI_API_KEY": "your-openai-api-key-here",
    "OPENAI_CONVERSATION_ASSISTANT_ID": "your-assistant-id-here",
    "OPENAI_ORGANIZATION_ID": "your-org-id-here"
  }
}
```

### Configure OpenAI Settings

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com)
2. Create an Assistant in OpenAI Platform with:
   - Model: GPT-4
   - Instructions: Medical triage assistant instructions
   - Tools: Function calling enabled
3. Copy the Assistant ID
4. Update `config/local.settings.json` with your credentials

## Step 4: Run the Application

### Using npm scripts (Recommended)

```bash
# Start with default Node.js version
npm start

# Start with Node.js v20 specifically
npm run start:node20
```

### Using scripts directly

```bash
# Basic start
./scripts/start/start.sh

# With Node.js v20
./scripts/start/start-node20.sh
```

The application will start on `http://localhost:7071`

## Step 5: Test the Application

### Run Integration Tests

**Recommended: Use the automated test script**
```bash
# Automatically starts Azure Functions, Azurite, and runs all tests
./scripts/test/test-all.sh

# Run specific number of test scenarios
./scripts/test/test-all.sh 3
```

**Alternative: Manual testing**
```bash
# Run all tests manually (requires Azure Functions to be running)
npm test

# Run specific test suites
cd tests
npm run test:simple    # Simple HTTP test
npm run test:direct    # Direct API test
```

### Manual Testing with cURL

```bash
# Test the endpoint
curl -X POST http://localhost:7071/api/symptomAssessmentBot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have chest pain",
    "patientId": "test-patient-001"
  }'
```

## Step 6: Verify Installation

Check that everything is working:

1. The function starts without errors
2. You see: `Functions: symptomAssessmentBot: [GET,POST] http://localhost:7071/api/symptomAssessmentBot`
3. Test endpoint returns a valid response
4. No error messages about missing dependencies

## Common Issues

### Node.js Version Mismatch
```
Error: Incompatible Node.js version
```
**Solution**: Use Node.js v20.x with `nvm use 20`

### Missing OpenAI Credentials
```
Error: OPENAI_API_KEY environment variable is required
```
**Solution**: Update `config/local.settings.json` with valid API key

### Port Already in Use
```
Port 7071 is unavailable
```
**Solution**: Kill existing process or use different port:
```bash
func start --port 7072
```

## Next Steps

- Read the [Architecture Overview](ARCHITECTURE.md) to understand the system
- Check the [API Reference](API.md) for endpoint details
- See the [Development Guide](DEVELOPMENT.md) for coding standards
- Review the [Testing Guide](TESTING.md) for test writing

## Need Help?

- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review error logs in console output
- Contact the development team