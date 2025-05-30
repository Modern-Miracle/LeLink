# LeLink Integration Guide

## ✅ Integration Complete!

The LeLink backend now features **full integration** between the Azure Functions medical triage bot and the blockchain audit system. FHIR resources are automatically stored and logged to the blockchain.

## Integrated Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Patient App   │────▶│ Azure Functions │────▶│  OpenAI API     │
│                 │◀────│  (Triage Bot)   │◀────│                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        Generate FHIR Resources
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌──────────────┐          ┌──────────────┐
            │ FHIR Storage │          │  Blockchain  │
            │ (Azurite/    │          │   Logging    │
            │ FHIR Service)│          │  (Hashes)    │
            └──────────────┘          └──────────────┘
```

## How It Works

### 1. Medical Triage Flow
```javascript
// Patient sends symptoms
POST /api/symptomAssessmentBot
{
  "message": "I have chest pain",
  "patientId": "patient-123"
}

// Response includes all integration details
{
  "reply": "Based on your symptoms...",
  "resources": {
    "RiskAssessment": { /* FHIR compliant */ },
    "Observation": { /* FHIR compliant */ }
  },
  "fhirStorage": {
    "mode": "azurite", // or "fhir-service" in production
    "results": [
      {
        "resourceType": "RiskAssessment",
        "resourceId": "1234",
        "location": "http://localhost:10000/...",
        "etag": "..."
      }
    ]
  },
  "blockchain": {
    "network": "localhost",
    "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "results": [
      {
        "resourceId": "RiskAssessment-1234",
        "dataHash": "0x3b4c5d...",
        "transactionHash": "0x7a8b9c...",
        "blockNumber": 42
      }
    ]
  }
}
```

### 2. Storage Modes

#### Development Mode (`npm run dev`)
- **FHIR Storage**: Azurite (Azure Storage Emulator)
  - Local blob storage at http://localhost:10000
  - Container: `fhir-resources`
  - Blobs: `<ResourceType>/<ResourceId>.json`
- **Blockchain**: Local Hardhat node
  - RPC: http://localhost:8545
  - Uses test accounts

#### Production Mode (`npm run prod`)
- **FHIR Storage**: Azure FHIR Service
  - RESTful FHIR API
  - Bearer token authentication
- **Blockchain**: Ethereum mainnet/testnet
  - Configured network and contract

## Implementation Details

### Services Architecture

1. **FHIR Storage Service** (`/az/llmazfunc/src/services/fhirStorage.js`)
   - Dual-mode storage (Azurite/FHIR Service)
   - Automatic mode selection based on NODE_ENV
   - Patient resource queries
   - Blob storage management

2. **Blockchain Service** (`/az/llmazfunc/src/services/blockchain.js`)
   - SHA-256 hash generation
   - Smart contract integration
   - Transaction management
   - Network-agnostic design

3. **Triage Assistant** (`/az/llmazfunc/src/assistants/lekainkTriageAssistant.js`)
   - Generates FHIR resources
   - Orchestrates storage and logging
   - Fault-tolerant design (failures don't break the flow)

### Data Flow

1. **Patient Message** → Azure Function receives symptom description
2. **AI Assessment** → OpenAI Assistant evaluates symptoms
3. **FHIR Generation** → Creates RiskAssessment and Observation resources
4. **Parallel Processing**:
   - **Storage**: Resources saved to Azurite/FHIR Service
   - **Hashing**: SHA-256 hash calculated for each resource
   - **Blockchain**: Hash logged to smart contract
5. **Response** → Complete details returned to client

## Configuration

### Environment Variables

```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-proj-...
OPENAI_CONVERSATION_ASSISTANT_ID=asst_...
OPENAI_ORGANIZATION_ID=org-...

# FHIR Storage
ENABLE_FHIR_STORAGE=true  # Default: true
NODE_ENV=development      # or 'production'

# For Production FHIR Service
FHIR_SERVER_URL=https://your-fhir-server.azurehealthcareapis.com
FHIR_SERVER_BEARER_TOKEN=your-bearer-token

# Blockchain Integration
ENABLE_BLOCKCHAIN_LOGGING=true
BLOCKCHAIN_NETWORK=localhost  # or 'sepolia', 'mainnet'
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=0x...  # Your wallet private key
LELINK_CONTRACT_ADDRESS=0x...  # Auto-populated after deployment
```

## Quick Start

### 1. Initial Setup
```bash
# Configure environment
./setup-wizard.sh

# Choose:
# - Local development (Hardhat) for blockchain
# - Enable blockchain logging
# - Enable FHIR storage
```

### 2. Start Services
```bash
# Option A: Standard startup (logs to files)
./startup.sh

# Option B: Live monitoring (shows real-time logs)
./startup-live.sh
```

### 3. Test the Integration
```bash
# Run automated test scenarios
./run-testbot.sh

# You'll see:
# 🏥 === TRIAGE INTERACTION ===
# 📥 Patient Message: "I have chest pain"
# 🤖 Bot Reply: "This is an emergency..."
#
# 🔗 === BLOCKCHAIN LOGGING ===
# 📍 Network: localhost
# 📄 Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# ✅ Resources logged to blockchain successfully!
#
# 💾 === FHIR STORAGE ===
# 📦 Mode: azurite
# ✅ FHIR resources stored successfully!
```

## Monitoring & Verification

### Check FHIR Storage (Development)

```bash
# View stored resources
curl http://localhost:10000/devstoreaccount1/fhir-resources?restype=container&comp=list

# Download specific resource
curl http://localhost:10000/devstoreaccount1/fhir-resources/RiskAssessment/[id].json
```

### Query Blockchain

```javascript
// Using ethers.js
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const contract = new ethers.Contract(contractAddress, abi, provider);

// Get all records for a patient
const events = await contract.queryFilter(
  contract.filters.RecordCreated(null, null, patientId)
);

// Verify data integrity
const storedHash = events[0].args.dataHash;
const calculatedHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(fhirResource)));
console.log('Data integrity:', storedHash === calculatedHash);
```

## Security Considerations

1. **Data Privacy**
   - Only resource hashes stored on blockchain
   - Actual FHIR data in secure storage
   - Patient IDs can be anonymized

2. **Key Management**
   - Development: Uses Hardhat test keys
   - Production: Use Azure Key Vault or similar
   - Never commit private keys

3. **Access Control**
   - FHIR Service: Bearer token authentication
   - Blockchain: Wallet-based permissions
   - API: Implement authentication layer

4. **Compliance**
   - HIPAA: Audit trails maintained
   - GDPR: Data sovereignty respected
   - FHIR: Standards compliance

## Benefits of Integration

1. **Immutable Audit Trail**: Every FHIR resource creation is permanently logged
2. **Data Integrity**: Cryptographic verification of resource authenticity
3. **Transparency**: Patients can verify their data handling
4. **Compliance**: Automated audit logs for regulatory requirements
5. **Interoperability**: Standard FHIR format with blockchain verification

## Advanced Features

### Batch Processing
```javascript
// Process multiple resources in one transaction
const resources = [riskAssessment, observation1, observation2];
const blockchainResult = await blockchainService.logResources(resources, patientId);
```

### Patient Resource Queries
```javascript
// List all resources for a patient
const patientResources = await fhirStorageService.listPatientResources(patientId);

// Returns:
[
  {
    resourceType: "RiskAssessment",
    resourceId: "1234",
    createdAt: "2024-01-15T10:30:00Z",
    size: 2048
  },
  // ...
]
```

### Verification Endpoint
```javascript
// Add to Azure Functions
module.exports = async function (context, req) {
  const { resourceId, expectedHash } = req.body;
  
  // Fetch from storage
  const resource = await fhirStorageService.getResource('RiskAssessment', resourceId);
  
  // Calculate hash
  const actualHash = crypto.createHash('sha256')
    .update(JSON.stringify(resource))
    .digest('hex');
  
  // Query blockchain
  const blockchainEvents = await contract.queryFilter(
    contract.filters.RecordCreated(null, resourceId)
  );
  
  const blockchainHash = blockchainEvents[0]?.args.dataHash;
  
  context.res = {
    body: {
      verified: actualHash === expectedHash && actualHash === blockchainHash,
      actualHash,
      blockchainHash,
      blockNumber: blockchainEvents[0]?.blockNumber
    }
  };
};
```

## Troubleshooting

### Common Issues

1. **Azurite Connection Failed**
   - Ensure Azurite is running (started by test scripts)
   - Check port 10000 availability
   - Verify connection string

2. **Blockchain Transaction Failed**
   - Check wallet has sufficient balance
   - Verify contract address is correct
   - Ensure network is accessible

3. **FHIR Storage Error (Production)**
   - Verify FHIR_SERVER_URL is correct
   - Check bearer token validity
   - Ensure network connectivity

### Debug Mode

Enable detailed logging:
```bash
# In .env
LOG_LEVEL=debug
DEBUG=true

# View logs
tail -f logs/azure-functions.log
```

## Future Enhancements

1. **Multi-chain Support**: Deploy to multiple blockchains
2. **IPFS Integration**: Store encrypted FHIR resources on IPFS
3. **Zero-Knowledge Proofs**: Verify data without revealing content
4. **Smart Contract Upgrades**: Implement upgradeable contracts
5. **Analytics Dashboard**: Real-time monitoring interface

## Conclusion

The LeLink integrated system provides a complete solution for:
- AI-powered medical triage
- FHIR-compliant resource generation
- Secure storage with Azurite/FHIR Service
- Immutable blockchain audit trails
- Full data integrity verification

This architecture ensures healthcare data is handled with the highest standards of security, compliance, and transparency.