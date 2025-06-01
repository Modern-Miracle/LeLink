# LeLink - Privacy-Preserving Healthcare Data Management for Crisis Situations

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![NGI Sargasso](https://img.shields.io/badge/NGI-Sargasso-blue.svg)](https://ngisargasso.eu/)
[![EU Funding](https://img.shields.io/badge/EU-Horizon%20Europe-yellow.svg)](https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-purple.svg)](https://soliditylang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-black.svg)](https://openai.com/)
[![FHIR](https://img.shields.io/badge/FHIR-R4-red.svg)](https://hl7.org/fhir/)
[![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-blue.svg)](https://ethereum.org/)

**LeLink** is a privacy-preserving healthcare data management system specifically designed for **people in crisis situations**. This open-source platform combines AI-powered medical triage, FHIR-compliant resource generation, blockchain audit trails, and secure data storage to provide immediate, transparent, and trustworthy healthcare assistance when it's needed most.

> **🇪🇺 EU Funded Project**: LeLink is proudly supported by the [NGI Sargasso](https://ngisargasso.eu/) programme, fostering transatlantic collaboration between the EU, US, and Canada in Next Generation Internet technologies. This project has received funding from the European Union's Horizon Europe research and innovation programme.

> **🏛️ Organizations**: Developed by [Hora e.V.](https://hora-ev.eu) in collaboration with [Modern Miracle](https://modern-miracle.com) and [JurisCanada](https://www.linkedin.com/company/juriscanada/about/) (Legal & Compliance), focusing on innovative healthcare solutions for vulnerable populations.

> **📋 License**: This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.en.html). This ensures that any modifications or network-based services using this code must also be open source.

## 🌟 **Key Features for Crisis Healthcare**

- 🆘 **Crisis-Focused Design** - Optimized for emergency and vulnerable population healthcare needs
- 🏥 **AI-Powered Medical Triage** - Intelligent symptom assessment using OpenAI's GPT models for immediate guidance
- 📊 **FHIR Compliance** - Standards-compliant healthcare resource generation and secure storage
- 🔗 **Blockchain Audit Trails** - Immutable logging of data access ensuring transparency and data integrity
- 💾 **Secure FHIR Storage** - Dual-mode support: Azurite (development) and Azure FHIR Service (production)
- 🌐 **Accessible Web Interface** - Next.js 15 PWA with offline support for areas with limited connectivity
- 🔒 **Privacy-First Authentication** - Azure AD/Entra ID integration protecting sensitive patient data
- 📱 **Mobile-Ready PWA** - Install and use offline on any device, crucial for crisis response
- 🏗️ **Resilient Architecture** - Microservices design ensuring system availability during high-demand periods
- 🌍 **Multi-Language Support** - Designed for international crisis response scenarios

## 🏗️ **System Architecture**

LeLink consists of four integrated components:

### 1. **Frontend (Next.js 15)** - `/fe/LL-next/`
- Modern React-based web application with TypeScript
- Progressive Web App (PWA) with offline capabilities
- Azure AD/Entra ID authentication integration
- Real-time triage interface and patient management
- Blockchain audit trail visualization

### 2. **Backend (Azure Functions)** - `/az/llmazfunc/`
- Serverless medical triage assistant
- OpenAI GPT integration for intelligent symptom assessment
- FHIR resource generation (Observations, RiskAssessments)
- Automatic blockchain logging of medical interactions

### 3. **Smart Contract (Solidity)** - `/sc/LeLink-SC/`
- Ethereum-compatible blockchain audit system
- Immutable logging of healthcare data access
- Privacy-preserving (stores only hashes, not patient data)
- 100% test coverage with comprehensive security testing

### 4. **FHIR Storage Layer**
- **Development**: Azurite blob storage for local development
- **Production**: Azure FHIR Service integration with multiple authentication methods
- Full FHIR R4 compliance for healthcare interoperability

## 🚀 **Quick Start**

### **Prerequisites**
- **Node.js v20** (required for Azure Functions)
- **npm** or **yarn** package manager
- **Git** for cloning the repository
- **OpenAI API key** (required for medical triage functionality)
- **Docker** (optional, for containerized deployment)

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Modern-Miracle/LeLink.git
   cd LeLink
   ```

2. **Run the interactive setup wizard:**
   ```bash
   ./setup-wizard.sh
   ```
   This will guide you through configuring all necessary environment variables.

3. **Start all services:**
   ```bash
   ./startup.sh
   ```

4. **Access the application:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:7071
   - **Blockchain**: http://localhost:8545

### **Demo**

For demonstration purposes, a hosted version is available at: https://lelink.vercel.app

### **🐳 Docker Deployment (Recommended)**

#### **Complete System with Docker Compose**
```bash
# Quick start with all services
docker-compose up -d

# Development environment with hot reload
docker-compose -f docker-compose.development.yml up -d

# View logs
docker-compose logs -f
```

#### **Individual Service Containers**
```bash
# Build all Docker images
./scripts/docker-build.sh --all

# Run complete system in single container
docker run -p 80:80 lelink-complete:latest

# Run individual services
docker run -p 3000:3000 lelink-frontend:latest
docker run -p 7071:80 lelink-backend:latest
```

### **🛠️ Manual Setup (Development)**

#### **Manual Configuration**
```bash
# Copy environment files
cp .env.example .env
cp fe/LL-next/.env.example fe/LL-next/.env.local
cp az/llmazfunc/config/local.settings.json.example az/llmazfunc/config/local.settings.json

# Edit the files with your configuration
# Then start services
./startup.sh
```

#### **Development with Live Logs**
```bash
# See real-time colored logs from all services
./startup-live.sh
```

#### **Component-Specific Startup**
```bash
# Start only backend services (skip frontend)
./startup.sh --skip-fe

# Start only smart contract and frontend (skip Azure Functions)
./startup.sh --skip-az

# Start with automatic testing
./startup.sh --test
```

## 🐳 **Docker Usage**

### **Docker Compose Configurations**

#### **Production Deployment**
```bash
# Start all services for production
docker-compose up -d

# Services included:
# - Frontend (Next.js PWA) - Port 3000
# - Backend (Azure Functions) - Port 7071  
# - Blockchain (Hardhat) - Port 8545
# - FHIR Storage (Azurite) - Port 10000
# - Database (PostgreSQL) - Port 5432
# - Cache (Redis) - Port 6379
# - Monitoring (Prometheus) - Port 9090
```

#### **Development Environment**
```bash
# Start development environment with hot reload
docker-compose -f docker-compose.development.yml up -d

# Additional development services:
# - Mailcatcher (testing) - Port 1080
# - Documentation server - Port 8080
# - Smart contract tools
```

### **Docker Build Script**
```bash
# Build all images
./scripts/docker-build.sh --all

# Build specific services
./scripts/docker-build.sh --frontend --backend

# Build and push to registry
./scripts/docker-build.sh --all --push --registry your-registry.com/

# Build with custom tag
./scripts/docker-build.sh --complete --tag v1.0.0
```

### **Single Container Deployment**
```bash
# Run complete system in one container
docker run -d \
  --name lelink-crisis-healthcare \
  -p 80:80 \
  -e OPENAI_API_KEY=your-key \
  -e NEXTAUTH_SECRET=your-secret \
  lelink-complete:latest
```

### **Environment Variables for Docker**
Create a `.env` file for Docker Compose:
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-key
OPENAI_CONVERSATION_ASSISTANT_ID=asst_your-id
OPENAI_ORGANIZATION_ID=org-your-id

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
AUTH_MICROSOFT_ENTRA_ID_ID=your-azure-app-id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your-azure-secret
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=your-tenant-id

# Database
DATABASE_PASSWORD=secure-password

# Blockchain (auto-populated after deployment)
LELINK_CONTRACT_ADDRESS=0x...
```

## 📜 **Available Scripts**

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

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### What this means:
- ✅ **Free to use** - Use this software for any purpose
- ✅ **Free to modify** - Change the code to fit your needs
- ✅ **Free to distribute** - Share your improvements with others
- ⚠️ **Copyleft requirement** - Any modifications must also be open source
- ⚠️ **Network copyleft** - If you run this as a web service, you must provide the source code

### Why AGPL v3?
We chose AGPL v3 to ensure that improvements to healthcare technology remain open and accessible to everyone, especially in network-deployed scenarios like healthcare SaaS platforms.

**See the [LICENSE](LICENSE) file for the complete license text.**

## 🏛️ **Organizations**

### [Hora e.V.](https://hora-ev.eu)
Hora e.V. is a German non-profit organization dedicated to developing innovative solutions for social challenges, with a particular focus on supporting vulnerable populations through technology and community engagement.

### [Modern Miracle](https://modern-miracle.com)
Modern Miracle specializes in cutting-edge healthcare technology solutions, bringing together expertise in AI, blockchain, and digital health to create transformative applications for crisis situations.

### [JurisCanada](https://www.linkedin.com/company/juriscanada/about/)
JurisCanada provides legal and compliance expertise, ensuring that LeLink meets international healthcare regulations, data protection standards, and regulatory requirements across multiple jurisdictions, particularly focusing on crisis healthcare scenarios and vulnerable population protection.

## 🇪🇺 **EU Funding & Acknowledgments**

This project has received funding from the European Union's Horizon Europe research and innovation programme under the [NGI Sargasso](https://ngisargasso.eu/) initiative. NGI Sargasso fosters transatlantic collaboration between the EU, US, and Canada in Next Generation Internet technologies, supporting innovation in:

- 🔒 **Decentralized Technologies** - Blockchain solutions for healthcare data integrity
- 🛡️ **Trust & Data Sovereignty** - Privacy-preserving healthcare systems
- 🌐 **Internet Innovation** - Next-generation healthcare data management
- 🤝 **Transatlantic Collaboration** - EU-US-Canada technology partnerships

### Commercial Licensing
For proprietary or commercial use that cannot comply with AGPL v3 terms, please contact:
- **Hora e.V.**: [contact@hora-ev.eu](mailto:contact@hora-ev.eu)
- **Modern Miracle**: [contact@modern-miracle.com](mailto:contact@modern-miracle.com)
- **JurisCanada** (Legal & Compliance): [LinkedIn](https://www.linkedin.com/company/juriscanada/about/)