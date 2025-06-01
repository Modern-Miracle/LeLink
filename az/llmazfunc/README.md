# LeLink Azure Functions - Crisis Medical Triage Backend

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![NGI Sargasso](https://img.shields.io/badge/NGI-Sargasso-blue.svg)](https://ngisargasso.eu/)
[![Azure Functions](https://img.shields.io/badge/Azure-Functions-blue.svg)](https://azure.microsoft.com/en-us/services/functions/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-black.svg)](https://openai.com/)
[![FHIR](https://img.shields.io/badge/FHIR-R4-red.svg)](https://hl7.org/fhir/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)

A serverless backend service designed to provide **immediate AI-powered medical triage for people in crisis situations**. This Azure Functions application integrates OpenAI's GPT models with FHIR-compliant healthcare resource generation and blockchain audit logging.

> **🇪🇺 EU Funded Project**: This project is supported by the [NGI Sargasso](https://ngisargasso.eu/) programme under the European Union's Horizon Europe research and innovation programme, fostering transatlantic collaboration in Next Generation Internet technologies.

> **🏛️ Organizations**: Developed by [Hora e.V.](https://hora-ev.eu) in collaboration with [Modern Miracle](https://modern-miracle.com) and [JurisCanada](https://www.linkedin.com/company/juriscanada/about/) (Legal & Compliance).

## 🌟 **Crisis-Focused Features**

- 🆘 **Emergency Triage** - AI-powered rapid medical assessment for crisis situations
- 🏥 **OpenAI Integration** - Advanced GPT models trained for medical scenario evaluation
- 📊 **FHIR Resource Generation** - Standards-compliant healthcare data (RiskAssessment, Observation)
- 🔗 **Blockchain Logging** - Immutable audit trails for data transparency and trust
- 💾 **Dual Storage Support** - Azurite (dev) and Azure FHIR Service (production)
- ⚡ **Serverless Architecture** - Scales automatically during crisis events
- 🌍 **Multi-Language Support** - International crisis response capabilities
- 🔒 **Privacy-First Design** - HIPAA/GDPR compliant data handling

## 🏗️ **Architecture**

### **Core Components**

```
📱 Frontend Request → 🔧 Azure Function → 🤖 OpenAI Assistant → 📋 FHIR Resources
                                              ↓
                                         🔗 Blockchain Hash → 💾 Storage Layer
```

### **Key Services**

- **`symptomAssessmentBot/`** - Main HTTP endpoint for medical triage
- **`lekainkTriageAssistant.js`** - Core AI triage logic with FHIR generation
- **`services/openai.js`** - OpenAI API integration and conversation management
- **`services/blockchain.js`** - Immutable audit trail logging
- **`services/fhirStorage.js`** - Healthcare data storage (Azurite/Azure FHIR Service)

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 20+ (automatically switched by startup scripts)
- OpenAI API key with GPT-4 access
- Azure Functions Core Tools (optional for local development)

### **Installation**

1. **Navigate to backend directory:**
   ```bash
   cd az/llmazfunc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp config/local.settings.json.example config/local.settings.json
   # Edit config/local.settings.json with your OpenAI credentials
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Test the triage endpoint:**
   ```bash
   curl -X POST http://localhost:7071/api/symptomAssessmentBot \
     -H "Content-Type: application/json" \
     -d '{"message": "I have chest pain", "threadId": null, "patientId": "test-123"}'
   ```

## 🔧 **Configuration**

### **Required Environment Variables**

```javascript
// config/local.settings.json
{
  "IsEncrypted": false,
  "Values": {
    // OpenAI Configuration (Required)
    "OPENAI_API_KEY": "sk-proj-...",
    "OPENAI_CONVERSATION_ASSISTANT_ID": "asst_...",
    "OPENAI_ORGANIZATION_ID": "org-...",
    
    // FHIR Storage Configuration
    "ENABLE_FHIR_STORAGE": "true",
    
    // Development (Azurite)
    "AZURE_STORAGE_CONNECTION_STRING": "UseDevelopmentStorage=true",
    
    // Production (Azure FHIR Service)
    "FHIR_SERVER_URL": "https://your-fhir-server.azurehealthcareapis.com",
    "AZURE_TENANT_ID": "your-tenant-id",
    "AZURE_CLIENT_ID": "your-client-id",
    "AZURE_CLIENT_SECRET": "your-client-secret",
    
    // Blockchain Configuration
    "ENABLE_BLOCKCHAIN_LOGGING": "true",
    "BLOCKCHAIN_RPC_URL": "http://localhost:8545",
    "LELINK_CONTRACT_ADDRESS": "0x..."
  }
}
```

### **Development vs Production Modes**

```bash
# Development Mode (uses Azurite for FHIR storage)
npm run dev

# Production Mode (uses Azure FHIR Service)
npm run prod
```

## 📊 **Medical Triage Flow**

### **Crisis Scenario Handling**

The system is optimized for various crisis situations:

1. **High-Risk Emergencies** (Chest Pain, Severe Trauma)
   - Immediate escalation recommendations
   - Emergency contact information
   - Critical care instructions

2. **Medium-Risk Situations** (Persistent Headaches, Abdominal Pain)
   - Symptom monitoring guidelines
   - When to seek medical attention
   - Self-care recommendations

3. **Low-Risk Issues** (Minor Cuts, Common Cold)
   - Home treatment options
   - Symptom tracking
   - Prevention advice

### **API Endpoints**

#### **POST /api/symptomAssessmentBot**

**Request:**
```json
{
  "message": "I have severe chest pain and difficulty breathing",
  "threadId": "thread_abc123",
  "patientId": "patient_456"
}
```

**Response:**
```json
{
  "reply": "This sounds like a medical emergency. Please call 911 immediately...",
  "threadId": "thread_abc123",
  "fhirResources": {
    "riskAssessment": {
      "resourceType": "RiskAssessment",
      "id": "risk-abc123",
      "status": "final",
      "prediction": [
        {
          "outcome": {
            "text": "High risk - immediate medical attention required"
          },
          "probabilityDecimal": 0.95
        }
      ]
    },
    "observation": {
      "resourceType": "Observation",
      "id": "obs-abc123",
      "status": "final",
      "code": {
        "text": "Chest pain assessment"
      },
      "valueString": "Severe chest pain with dyspnea"
    }
  },
  "blockchain": {
    "transactionHash": "0x...",
    "resourceHashes": {
      "riskAssessment": "sha256:...",
      "observation": "sha256:..."
    }
  },
  "storage": {
    "status": "success",
    "mode": "azurite",
    "resourceIds": ["risk-abc123", "obs-abc123"]
  }
}
```

## 🧪 **Testing**

### **Integration Tests**

The system includes comprehensive integration tests covering real medical scenarios:

```bash
# Run all integration tests
npm test

# Run specific scenario tests
./scripts/test/test-all.sh

# Test specific crisis scenarios
node tests/integration/testLelinkBot.js
```

### **Test Scenarios Included**

- **Chest Pain** - High-risk cardiac emergency simulation
- **Severe Headache** - Neurological assessment scenarios
- **Abdominal Pain** - Gastrointestinal crisis evaluation
- **Minor Injuries** - Low-risk wound assessment
- **Respiratory Issues** - COVID-19 and respiratory crisis handling

### **Test Results Location**

Results are stored in timestamped directories:
```
tests/integration/lekink-test-results/
├── chestPain-1748269986310/
│   ├── conversation.json
│   ├── summary.json
│   └── resources/
│       ├── RiskAssessment-xxx.json
│       └── Observation-xxx.json
└── headache-1748270049546/
    └── ...
```

## 🛡️ **Security & Compliance**

### **Healthcare Data Protection**

- **HIPAA Compliance** - Protected Health Information (PHI) handling
- **GDPR Compliance** - European data protection standards
- **Zero-PHI Blockchain** - Only hashes stored on blockchain, never patient data
- **Encryption at Rest** - All stored data encrypted
- **Audit Trails** - Complete immutable logging of all data access

### **Crisis-Specific Security**

- **Anonymous Mode** - Support for crisis situations where identity protection is crucial
- **Emergency Access** - Bypass mechanisms for life-threatening situations
- **Data Minimization** - Only collect essential information for triage
- **Temporary Storage** - Option for non-persistent crisis consultations

## 🚀 **Deployment**

### **Azure Functions Deployment**

```bash
# Deploy to Azure
npm run deploy

# Deploy with specific configuration
az functionapp deployment source config-zip \
  --resource-group myResourceGroup \
  --name myFunctionApp \
  --src deploy.zip
```

### **Docker Deployment**

```bash
# Build Docker image
docker build -t lelink-backend .

# Run container
docker run -p 7071:80 \
  -e OPENAI_API_KEY=your-key \
  -e OPENAI_CONVERSATION_ASSISTANT_ID=your-assistant-id \
  lelink-backend
```

## 📚 **Additional Documentation**

- [API Reference](docs/API.md) - Complete endpoint documentation
- [Architecture Guide](docs/ARCHITECTURE.md) - Detailed system design
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [Testing Guide](docs/TESTING.md) - Comprehensive testing strategies
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/crisis-improvement`
3. Test with crisis scenarios: `npm test`
4. Submit pull request with detailed description

## 📄 **License**

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

This ensures that any modifications or network-based services using this code must also be open source.

## 🏛️ **Organizations**

**Developed by:**
- **[Hora e.V.](https://hora-ev.eu)** - German non-profit focused on social innovation and crisis response
- **[Modern Miracle](https://modern-miracle.com)** - Healthcare technology specialists  
- **[JurisCanada](https://www.linkedin.com/company/juriscanada/about/)** - Legal and compliance expertise for healthcare regulations

**Contact:**
- Hora e.V.: [contact@hora-ev.eu](mailto:contact@hora-ev.eu)
- Modern Miracle: [contact@modern-miracle.com](mailto:contact@modern-miracle.com)
- JurisCanada: [LinkedIn](https://www.linkedin.com/company/juriscanada/about/)

## 🇪🇺 **EU Funding Acknowledgment**

This project has received funding from the European Union's Horizon Europe research and innovation programme under the [NGI Sargasso](https://ngisargasso.eu/) initiative, supporting innovation in decentralized healthcare technologies.

---

**Built with ❤️ for crisis healthcare response** 🏥🆘