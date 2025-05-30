# Architecture Overview

## System Architecture

The LeLink Triage Assistant is built as a serverless Azure Functions application that interfaces with OpenAI's Assistant API to provide medical triage services, with integrated FHIR storage and blockchain audit trails.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client App    │────▶│ Azure Functions │────▶│  OpenAI API     │
│   (HTTP/REST)   │◀────│   (Node.js)     │◀────│  (Assistant)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  FHIR Resources     │
                    │  Generated          │
                    └─────────────────────┘
                               │
                 ┌─────────────┴────────────┐
                 ▼                          ▼
         ┌──────────────┐          ┌──────────────┐
         │ FHIR Storage │          │  Blockchain  │
         │ (Azurite/    │          │ (Hash Logs)  │
         │ FHIR Service)│          │              │
         └──────────────┘          └──────────────┘
```

## Core Components

### 1. Azure Function Entry Point (`src/functions/symptomAssessmentBot/`)
- **index.js**: Main HTTP trigger function
- **function.json**: Azure Function configuration
- Handles incoming HTTP requests and responses
- Manages request validation and error handling
- Displays real-time triage interactions and blockchain logging

### 2. Assistant Layer (`src/assistants/`)
- **lekainkTriageAssistant.js**: Core triage logic
- Interfaces with OpenAI Assistant API
- Manages conversation flow and tool function handling
- Generates FHIR-compatible resources (RiskAssessment, Observation)
- Integrates with blockchain and FHIR storage services

### 3. Services Layer (`src/services/`)
- **openai.js**: OpenAI API wrapper
  - Thread management
  - Message handling
  - Assistant run orchestration
  - Tool function execution
- **blockchain.js**: Blockchain integration
  - FHIR resource hash generation (SHA-256)
  - Smart contract interaction
  - Audit trail creation
  - Transaction management
- **fhirStorage.js**: FHIR storage service
  - Dual-mode storage (Azurite/FHIR Service)
  - Resource persistence
  - Patient resource queries
  - Blob storage management

### 4. Utilities Layer (`src/utils/`)
- **config.js**: Configuration management
  - Environment-based settings
  - Blockchain configuration
  - FHIR storage settings
- **constants.js**: Application constants
- **errors.js**: Custom error types
- **logger.js**: Logging utility

## Data Flow

1. **Request Reception**
   - HTTP POST request arrives at `/api/symptomAssessmentBot`
   - Request contains: `message`, `patientId`, optional `threadId`

2. **Validation**
   - Input validation (required fields, data types, length limits)
   - Safety checks on message content

3. **Thread Management**
   - Create new thread if not provided
   - Retrieve existing thread if threadId is supplied

4. **Assistant Processing**
   - Message sent to OpenAI Assistant
   - Assistant evaluates symptoms and may call tool functions:
     - `createRiskAssessment`: Generates risk evaluation
     - `createObservation`: Records symptom observations
     - `conversationStatusCheck`: Marks conversation complete

5. **Resource Generation**
   - Tool function outputs are captured
   - FHIR-compliant resources are formatted
   - Resources include proper IDs and timestamps

6. **Storage & Audit**
   - FHIR resources stored in Azurite (dev) or FHIR Service (prod)
   - Resource hashes logged to blockchain for audit trail
   - Both operations are fault-tolerant (failures don't break the flow)

7. **Response Formation**
   - Assistant's reply text
   - Generated FHIR resources
   - Thread ID for conversation continuity
   - Completion status
   - Blockchain transaction details
   - FHIR storage confirmation

## Key Design Decisions

### 1. Serverless Architecture
- **Why**: Scalability, cost-effectiveness, managed infrastructure
- **Impact**: Stateless design, external state management

### 2. OpenAI Assistant API
- **Why**: Built-in conversation management, tool functions, context retention
- **Impact**: Simplified conversation logic, reliable tool execution

### 3. Dual Storage Architecture
- **Why**: Development flexibility, production scalability
- **Impact**: Azurite for local development, Azure FHIR Service for production
- **Benefit**: Full FHIR resource persistence with tamper-proof audit trails

### 4. FHIR Resource Format
- **Why**: Healthcare industry standard, interoperability
- **Impact**: Structured medical data, future integration ready

### 5. Blockchain Integration
- **Why**: Immutable audit trail, data integrity verification
- **Impact**: Every FHIR resource hash is permanently recorded

## Storage Architecture

### Development Mode (`npm run dev`)
- **FHIR Storage**: Azure Storage Emulator (Azurite)
  - Container: `fhir-resources`
  - Blob naming: `<ResourceType>/<ResourceId>.json`
  - Access: http://localhost:10000
- **Blockchain**: Local Hardhat node
  - Network: localhost
  - RPC: http://localhost:8545

### Production Mode (`npm run prod`)
- **FHIR Storage**: Azure FHIR Service
  - RESTful FHIR API
  - Bearer token authentication
  - Full FHIR server capabilities
- **Blockchain**: Ethereum mainnet/testnet
  - Network: As configured
  - Smart contract: LeLink audit contract

## Security Considerations

1. **API Key Management**
   - OpenAI API keys stored in environment variables
   - FHIR Service bearer tokens secured
   - Never committed to source control

2. **Input Validation**
   - All inputs sanitized and validated
   - Message length limits enforced
   - Type checking on all parameters

3. **Error Handling**
   - Sensitive information never exposed in error messages
   - Correlation IDs for request tracking
   - Structured error responses

4. **Data Privacy**
   - Only FHIR resource hashes stored on blockchain
   - Actual medical data in secure storage
   - Patient IDs anonymized in blockchain records

## Scalability

The architecture supports:
- Horizontal scaling via Azure Functions
- Concurrent request handling
- Independent conversation threads
- Stateless operation for easy scaling
- Distributed storage across Azurite/FHIR Service

## Monitoring & Observability

1. **Real-time Logs**
   - Triage interactions displayed in console
   - Blockchain transactions logged
   - FHIR storage operations tracked

2. **Structured Logging**
   - Correlation IDs for request tracing
   - Log levels for filtering
   - JSON formatted for analysis

## Testing Architecture

1. **Automated Test Bot** (`run-testbot.sh`)
   - Simulates patient conversations
   - Tests multiple risk scenarios
   - Exports FHIR resources for validation
   - Verifies blockchain logging

2. **Test Scenarios**
   - Chest pain (emergency)
   - Headache (medium risk)
   - Abdominal pain (medium risk)
   - Minor cut (low risk)

## Future Considerations

1. **State Management**
   - Consider Azure Cosmos DB for conversation persistence
   - Redis cache for session management

2. **Enhanced Security**
   - Azure Key Vault for secrets management
   - API authentication/authorization layer

3. **Monitoring**
   - Application Insights integration
   - Custom metrics for medical accuracy

4. **Integration**
   - EHR system integration
   - Multi-channel support (web, mobile, voice)
   - HL7 FHIR server federation