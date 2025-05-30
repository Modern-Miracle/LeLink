# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeLink is a privacy-preserving healthcare data management system with integrated components:

1. **Frontend** (`fe/LL-next/`) - Next.js 15 application with authentication, patient management, and medical triage interfaces
2. **Azure Functions Backend** (`az/llmazfunc/`) - A serverless medical triage assistant using OpenAI's API for symptom assessment and FHIR resource generation
3. **Smart Contract** (`sc/LeLink-SC/`) - A blockchain-based audit system for healthcare data access logs
4. **FHIR Storage** - Dual-mode storage supporting Azurite (dev) and Azure FHIR Service (prod)
5. **Blockchain Integration** - Automatic logging of FHIR resource hashes for tamper-proof audit trails

## Common Development Commands

### Quick Start (Full System)

```bash
# Initial setup
./setup-wizard.sh          # Configure environment variables
./startup.sh               # Start all services (or ./startup-live.sh for live logs)
./run-testbot.sh          # Run test scenarios

# Start with specific options
./startup.sh --skip-sc     # Skip blockchain, only Azure Functions
./startup-live.sh          # Real-time colored logs in terminal
```

### Azure Functions (Medical Triage Assistant)

```bash
# Setup and run
cd az/llmazfunc
npm install
cp config/local.settings.json.example config/local.settings.json  # Configure OpenAI credentials

# Development vs Production
npm run dev               # Development mode (uses Azurite for FHIR storage)
npm run prod              # Production mode (uses Azure FHIR Service)

# Testing
npm test                  # Run tests (requires Azure Functions running)
./run-testbot.sh          # Interactive test scenarios with FHIR export

# Deploy
npm run deploy
```

### Frontend (Next.js Application)

```bash
# Setup and run
cd fe/LL-next
npm install

# Development
npm run dev               # Start development server (http://localhost:3000)

# Production build
npm run build             # Build for production
npm start                 # Start production server

# Code quality
npm run lint              # Run Next.js linter
```

### Smart Contract

```bash
# Setup and development
cd sc/LeLink-SC
npm run setup          # Install dependencies and compile
npm run node           # Start local Hardhat node

# Compile and test
npm run compile        # Compile contracts
npm test               # Run all 81 tests
npm run test:coverage  # Run with coverage report
npm run test:gas       # Run with gas reporting
npm run full-test      # Complete test suite with coverage
npm run size           # Check contract sizes

# Deploy
npm run deploy:localhost  # Deploy to local network
npm run deploy:sepolia    # Deploy to Sepolia testnet
npm run deploy:mainnet    # Deploy to mainnet

# Code quality
npm run lint           # Run Solidity and TypeScript linters
npm run format         # Format code with Prettier
```

## Architecture

### Integrated System Flow
```
Frontend (Next.js) → API Routes → Backend Services
         ↓
    User Interface
    - Login/Registration
    - Dashboard
    - Patient Management
    - Triage Assessment
         ↓
HTTP POST /api/triage/submit → HTTP POST /api/symptomAssessmentBot → Azure Function → OpenAI Assistant API
     (Frontend API Route)           (Azure Functions Endpoint)                ↓
                                                                      FHIR Resources Generated
                                                                              ↓
                                            ┌─────────────────┴─────────────────┐
                                            ↓                                   ↓
                                    Store in Azurite/FHIR Service        Hash → Blockchain
                                            ↓                                   ↓
                                      Storage Confirmation              Audit Trail Created
                                            ↓                                   ↓
                                            └─────────────────┬─────────────────┘
                                                              ↓
                                                      Complete Response
```

### Integration Points

#### Frontend → Backend Integration
- **API Route**: `/api/triage/submit` proxies to Azure Functions `/api/symptomAssessmentBot`
- **Communication**: HTTP POST with JSON payload containing message, threadId, and patientId
- **Response Types**: JSON or streaming for real-time conversation updates
- **Authentication**: Optional API key header for backend access control

#### Backend → Blockchain Integration
- **Automatic Hashing**: Every FHIR resource generated is SHA-256 hashed
- **Blockchain Logging**: Hashes logged via `src/services/blockchain.js`
- **Smart Contract Method**: `createRecord(resourceId, hash, metadata)`
- **Fault Tolerance**: Blockchain failures don't interrupt main triage flow

#### Frontend → Blockchain Integration
- **Direct Access**: Frontend can query blockchain independently
- **Dual Mode Support**: Browser (MetaMask) or server-side transactions
- **ABI Import**: Uses `sc/LeLink-SC/react/abi/lelink.abi.ts`
- **Audit Trail Viewing**: Components in `components/blockchain/` display audit logs

### Frontend Architecture
Key directories:
- `app/` - Next.js 15 app directory with pages and API routes
- `components/` - Reusable React components including UI library (shadcn/ui)
- `lib/` - Utilities, types, and service integrations
- `app/api/` - API routes for backend communication

Key features:
- NextAuth.js integration for authentication
- Azure AD/Entra ID support
- FHIR resource management interfaces
- Medical triage submission forms
- Patient and appointment management

### Backend Architecture
Key files:
- `src/functions/symptomAssessmentBot/index.js` - Main HTTP endpoint
- `src/assistants/lekainkTriageAssistant.js` - Core triage logic with FHIR resource generation
- `src/services/openai.js` - OpenAI API integration
- `src/services/blockchain.js` - Blockchain hash logging
- `src/services/fhirStorage.js` - FHIR resource storage (Azurite/FHIR Service)

### Smart Contract Architecture
- `contracts/LeLink.sol` - Main contract storing healthcare access logs as events
- Uses OpenZeppelin for security (Ownable, Pausable)
- Stores only hashes and metadata, no actual patient data
- 100% test coverage with comprehensive edge case testing

## Testing Approach

### Azure Functions
- Integration tests in `tests/integration/` covering multiple medical scenarios
- Test scenarios: chest pain (high risk), headache (medium risk), abdominal pain (medium risk), minor cut (low risk)
- Automated test runner: `./scripts/test/test-all.sh` (includes production FHIR service configuration wizard)
- Test results stored in: `tests/integration/lekink-test-results/` with timestamps

### Smart Contract
- 81 comprehensive tests covering all functionality
- Categories: deployment, record CRUD, access control, sharing, events, gas optimization
- Run specific test categories: `npx hardhat test --grep "Record Creation"`

## Key Configuration

### Azure Functions
Required environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_CONVERSATION_ASSISTANT_ID` - Assistant ID for triage
- `OPENAI_ORGANIZATION_ID` - OpenAI organization ID

### Frontend
Required environment variables:
- `AZURE_CLIENT_ID` - Azure AD application ID
- `AZURE_CLIENT_SECRET` - Azure AD client secret
- `AZURE_TENANT_ID` - Azure AD tenant ID
- `AUTH_SECRET` - NextAuth.js secret for JWT signing

### FHIR Storage
Development (automatic with Azurite):
- `ENABLE_FHIR_STORAGE` - Enable/disable storage (default: true)

Production (Azure FHIR Service) - Three authentication methods:
1. **Managed Identity**: Uses DefaultAzureCredential (recommended for Azure deployments)
2. **Service Principal**: Requires `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
3. **Bearer Token**: `FHIR_SERVER_BEARER_TOKEN` (for testing only)

Common configuration:
- `FHIR_SERVER_URL` - FHIR server endpoint

### Blockchain Integration
- `ENABLE_BLOCKCHAIN_LOGGING` - Enable blockchain audit trail
- `BLOCKCHAIN_RPC_URL` - Blockchain node URL
- `LELINK_CONTRACT_ADDRESS` - Deployed contract address (auto-set)

### Smart Contract
Network configuration in `hardhat.config.ts` for localhost, Sepolia, and mainnet deployments.

## Development Notes

- Frontend uses Next.js 15 with TypeScript and Tailwind CSS
- Azure Functions uses Node.js 20 LTS (automatically switched by startup scripts)
- Smart contract uses Solidity 0.8.28 with TypeScript for deployment scripts
- All components follow security best practices and include comprehensive error handling
- The system generates FHIR-compliant healthcare resources for interoperability
- FHIR resources are stored in Azurite (dev) or Azure FHIR Service (prod)
- All medical data is hashed and logged to blockchain for audit trails
- Frontend includes shadcn/ui component library for consistent UI
- Authentication supports NextAuth with Azure AD/Entra ID integration
- Frontend integrates with Microsoft Graph API for user details
- Use `./startup-live.sh` to see real-time activity during development
- Use `./run-testbot.sh` to test medical scenarios with automated patients
- Both frontend and Azure Functions include Dockerfiles for containerized deployment