# LeLink Backend

A privacy-preserving healthcare data management system that combines:
- 🏥 **AI-powered medical triage** using OpenAI
- 📊 **FHIR-compliant resource generation**
- 🔗 **Blockchain audit trails** for data integrity
- 💾 **Secure FHIR storage** (Azurite/Azure FHIR Service)

## 🚀 Quick Start

### Prerequisites
- Node.js v20 (required for Azure Functions)
- Docker (optional, for running Azurite separately)

### Initial Setup
```bash
# 1. Run the setup wizard to configure environment variables
./setup-wizard.sh

# 2. Start all services
./startup.sh
```

## 📜 Available Scripts

### 1. **startup.sh** - Standard Service Startup
Starts all backend services with logs redirected to files.

```bash
./startup.sh [options]

Options:
  --skip-sc               Skip starting the smart contract
  --skip-az               Skip starting Azure Functions
  --test                  Run tests after startup
  --help                  Show help message

Examples:
  ./startup.sh                    # Start everything
  ./startup.sh --skip-sc          # Start only Azure Functions
  ./startup.sh --test             # Start and run tests
```

**What it does:**
- ✅ Switches to Node.js v20
- ✅ Compiles and deploys smart contract
- ✅ Starts Hardhat blockchain node
- ✅ Starts Azure Functions with medical triage bot
- ✅ Logs output to `logs/` directory

### 2. **startup-live.sh** - Live Monitoring Mode
Same as startup.sh but shows real-time logs in terminal with color coding.

```bash
./startup-live.sh
```

**Features:**
- 🔵 **[Hardhat]** - Blockchain activity in blue
- 🟢 **[Azure]** - Medical triage activity in green
- 🏥 **Triage interactions** highlighted
- 🔗 **Blockchain logging** highlighted
- 💾 **FHIR storage** operations shown

### 3. **run-testbot.sh** - Test Medical Scenarios
Runs automated medical triage scenarios to test the system.

```bash
./run-testbot.sh [options]

Options:
  -s, --scenarios <number>   Number of test scenarios to run
  -t, --type <type>         Scenario type (chest-pain, headache, abdominal-pain, minor-cut)
  --no-export               Skip exporting FHIR resources to files
  -h, --help                Show help message

Examples:
  ./run-testbot.sh                    # Run all scenarios
  ./run-testbot.sh -s 5               # Run 5 random scenarios
  ./run-testbot.sh -t chest-pain      # Run chest pain scenario
  ./run-testbot.sh --no-export        # Run without saving resources
```

**Test Scenarios:**
- **Chest Pain** - High risk emergency scenario
- **Headache** - Medium risk migraine scenario
- **Abdominal Pain** - Medium risk assessment
- **Minor Cut** - Low risk self-care scenario

## 🏗️ Architecture

### System Flow
```
1. Patient Message → Azure Function API
                           ↓
2. OpenAI Assistant → Risk Assessment
                           ↓
3. FHIR Resources Generated (RiskAssessment, Observation)
                           ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
4. Store in Azurite/FHIR Service    Hash → Blockchain
        ↓                                   ↓
5. Return Response with Storage Info and Audit Trail
```

### Data Storage

#### Development Mode (default)
- **FHIR Resources**: Stored in Azurite blob storage
- **Blockchain**: Local Hardhat node
- **Access**: http://localhost:10000 (Azurite), http://localhost:8545 (Blockchain)

#### Production Mode
- **FHIR Resources**: Azure FHIR Service
- **Blockchain**: Ethereum mainnet/testnet
- **Authentication**: Bearer token for FHIR Service

## 🔧 Configuration

### Environment Variables

Create a `.env` file (use setup-wizard.sh or copy .env.example):

```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-proj-...
OPENAI_CONVERSATION_ASSISTANT_ID=asst_...
OPENAI_ORGANIZATION_ID=org-...

# Blockchain Configuration
ENABLE_BLOCKCHAIN_LOGGING=true
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
LELINK_CONTRACT_ADDRESS=0x... (auto-populated)

# FHIR Storage
ENABLE_FHIR_STORAGE=true (default)
# For production only:
FHIR_SERVER_URL=https://your-fhir-server.azurehealthcareapis.com
FHIR_SERVER_BEARER_TOKEN=your-token
```

### Running in Different Modes

```bash
# Development (Azurite storage)
cd az/llmazfunc
npm run dev

# Production (Azure FHIR Service)
cd az/llmazfunc
npm run prod
```

## 📊 Monitoring

### View Logs
```bash
# Real-time monitoring
tail -f logs/azure-functions.log
tail -f logs/hardhat-node.log

# Or use startup-live.sh for color-coded output
```

### What to Look For

1. **Successful Triage**:
   ```
   🏥 === TRIAGE INTERACTION ===
   📥 Patient Message: "chest pain..."
   🤖 Bot Reply: "This is an emergency..."
   ```

2. **Blockchain Logging**:
   ```
   🔗 === BLOCKCHAIN LOGGING ===
   📍 Network: localhost
   📄 Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   ✅ Resources logged to blockchain successfully!
   ```

3. **FHIR Storage**:
   ```
   💾 === FHIR STORAGE ===
   📦 Mode: azurite
   ✅ FHIR resources stored successfully!
   ```

## 🧪 Testing

### Run All Tests
```bash
# Start services first
./startup.sh

# In another terminal
./run-testbot.sh
```

### Test Results
- Stored in: `az/llmazfunc/tests/integration/lekink-test-results/`
- Each test creates timestamped folders with:
  - `conversation.json` - Full chat history
  - `summary.json` - Test results
  - `resources/` - FHIR resources as JSON files

## 🛠️ Troubleshooting

### Services Won't Start
```bash
# Check if ports are in use
lsof -i :7071  # Azure Functions
lsof -i :8545  # Hardhat
lsof -i :10000 # Azurite

# Kill processes if needed
pkill -f "hardhat node"
pkill -f "func start"
```

### Node Version Issues
```bash
# Ensure Node.js v20 is installed
nvm install 20
nvm use 20
```

### Blockchain Connection Failed
- Check if Hardhat node is running: `curl http://localhost:8545`
- Verify contract address in `.env` matches deployment

### FHIR Storage Issues
- Check Azurite is running: `curl http://localhost:10000`
- Verify blob container exists
- For production, check FHIR_SERVER_URL and bearer token

## 📚 Additional Documentation

- [Azure Functions Documentation](az/llmazfunc/docs/)
- [Smart Contract Documentation](sc/LeLink-SC/docs/)
- [Integration Guide](integration-guide.md)
- [Environment Variables Guide](ENVIRONMENT_VARIABLES.md)

## 🤝 Contributing

1. Make changes
2. Test with `./run-testbot.sh`
3. Verify logs show expected behavior
4. Update documentation if needed

## 📄 License

See LICENSE file in repository root.