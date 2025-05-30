# LeLink Backend Environment Variables Guide

This document describes all environment variables used by the LeLink backend services.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Run the setup wizard (recommended):**
   ```bash
   ./setup-wizard.sh
   ```

3. **Or manually edit .env with your values**

## Required Variables

### Azure Functions (Medical Triage Bot)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for the medical triage bot | `sk-proj-abc123...` | ✅ Yes |
| `OPENAI_CONVERSATION_ASSISTANT_ID` | The ID of your OpenAI Assistant | `asst_abc123...` | ✅ Yes |
| `OPENAI_ORGANIZATION_ID` | Your OpenAI organization ID | `org-abc123...` | ✅ Yes |

### Smart Contract (For Production)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `BLOCKCHAIN_RPC_URL` | RPC URL for blockchain connection | `http://localhost:8545` | ✅ For integration |
| `BLOCKCHAIN_PRIVATE_KEY` | Private key for blockchain transactions | `0xabc123...` | ✅ For integration |
| `LELINK_CONTRACT_ADDRESS` | Deployed contract address (auto-set by startup.sh) | `0x123...` | ✅ After deployment |

## Optional Variables

### Network Configuration

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `SEPOLIA_URL` | Sepolia testnet RPC URL | `https://sepolia.infura.io/v3/YOUR-KEY` | - |
| `MAINNET_URL` | Ethereum mainnet RPC URL | `https://mainnet.infura.io/v3/YOUR-KEY` | - |
| `TESTNET_PRIVATE_KEY` | Private key for testnet deployment | `0xabc123...` | - |
| `MAINNET_PRIVATE_KEY` | Private key for mainnet deployment | `0xabc123...` | - |
| `ETHERSCAN_API_KEY` | For contract verification on Etherscan | `ABC123...` | - |

### Development Settings

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Logging verbosity | `debug`, `info`, `warn`, `error` | `info` |
| `NODE_ENV` | Node environment | `development`, `production` | `development` |
| `DEBUG` | Enable debug mode | `true`, `false` | `false` |
| `REPORT_GAS` | Enable gas reporting for smart contracts | `true`, `false` | `false` |
| `COINMARKETCAP_API_KEY` | For USD gas price reporting | `abc123...` | - |

### Azure Functions Settings

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `AZURE_FUNCTIONS_PORT` | Port for Azure Functions | `7071` | `7071` |
| `FUNCTIONS_WORKER_RUNTIME` | Azure Functions runtime | `node` | `node` |
| `FUNCTIONS_EXTENSION_VERSION` | Azure Functions version | `~4` | `~4` |
| `WEBSITE_NODE_DEFAULT_VERSION` | Node.js version for Azure | `~20` | `~20` |

### Integration Features

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `ENABLE_BLOCKCHAIN_LOGGING` | Log FHIR resources to blockchain | `true`, `false` | `false` |
| `ENABLE_FHIR_STORAGE` | Enable FHIR resource storage | `true`, `false` | `true` |
| `TEST_MODE` | Use test data instead of real APIs | `true`, `false` | `false` |
| `BLOCKCHAIN_NETWORK` | Target blockchain network | `localhost`, `sepolia`, `mainnet` | `localhost` |

### FHIR Storage Configuration

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `FHIR_SERVER_URL` | Azure FHIR Service URL (production) | `https://your-server.azurehealthcareapis.com` | - |
| `FHIR_AUTH_TYPE` | Authentication method for FHIR service | `managed-identity`, `service-principal`, `bearer-token` | `bearer-token` |
| `FHIR_SERVER_BEARER_TOKEN` | Bearer token for FHIR service (if using bearer-token auth) | `eyJ0eXAi...` | - |
| `AZURE_TENANT_ID` | Azure AD tenant ID (for service principal auth) | `12345678-1234-1234-1234-123456789012` | - |
| `AZURE_CLIENT_ID` | Service principal client ID | `87654321-4321-4321-4321-210987654321` | - |
| `AZURE_CLIENT_SECRET` | Service principal client secret | `your-client-secret` | - |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID (optional) | `abcdef12-3456-7890-abcd-ef1234567890` | - |
| `FHIR_VALIDATE_RESOURCES` | Enable FHIR resource validation | `true`, `false` | `false` |
| `FHIR_AUDIT_ENABLED` | Enable FHIR audit logging | `true`, `false` | `false` |

### Security Settings

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `API_SECRET_KEY` | API authentication secret | `your-secret-key` | - |
| `JWT_SECRET` | JWT signing secret | `your-jwt-secret` | - |
| `JWT_EXPIRY` | JWT token expiration | `24h`, `7d` | `24h` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000,https://app.com` | `*` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window | `900000` (15 min) | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | `100` |

### Optional External Services

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage for production | `DefaultEndpointsProtocol=https...` | - |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | Application Insights key | `abc123...` | - |
| `REDIS_URL` | Redis cache connection | `redis://localhost:6379` | - |

## Environment-Specific Files

### Azure Functions
The Azure Functions also use `config/local.settings.json` for configuration. The startup script will sync environment variables to this file automatically.

### Smart Contract
The smart contract uses environment variables directly from `.env` file via the `dotenv` package.

## Local Development Defaults

For local development with Hardhat, you can use these default values:

```env
# Local Hardhat Network
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_NETWORK=localhost

# Hardhat's default test account (Account #0)
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
LOCALHOST_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

⚠️ **WARNING**: Never use these keys on mainnet or with real funds!

## Getting API Keys

### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create a new API key
4. To create an Assistant, use the [OpenAI Playground](https://platform.openai.com/playground)

### Infura (For Ethereum Networks)
1. Sign up at [Infura.io](https://infura.io/)
2. Create a new project
3. Copy the project ID
4. Use in URLs: `https://sepolia.infura.io/v3/YOUR-PROJECT-ID`

### Etherscan (For Contract Verification)
1. Create account at [Etherscan.io](https://etherscan.io/)
2. Go to [API Keys](https://etherscan.io/myapikey)
3. Create a new API key

### CoinMarketCap (For Gas Price Reporting)
1. Sign up at [CoinMarketCap](https://coinmarketcap.com/api/)
2. Get your API key from the dashboard

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Use different keys for different environments** - Don't reuse production keys in development
3. **Rotate keys regularly** - Especially if they might have been exposed
4. **Use secure key storage in production** - Consider Azure Key Vault or similar
5. **Limit key permissions** - Use read-only keys where possible

## Troubleshooting

### Missing Environment Variables
If you see errors about missing variables:
1. Check your `.env` file exists
2. Ensure variables are properly formatted (no spaces around `=`)
3. Restart the services after changing `.env`

### Azure Functions Not Reading Variables
The startup script syncs `.env` to `config/local.settings.json`. If issues persist:
1. Check `config/local.settings.json` directly
2. Ensure JSON formatting is valid
3. Restart Azure Functions

### Contract Address Not Set
The `LELINK_CONTRACT_ADDRESS` is set automatically when you:
1. Run `./startup.sh` (deploys and saves address)
2. Or manually deploy and update `.env`

## Example .env for Local Development

```env
# Minimal setup for local development
OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_CONVERSATION_ASSISTANT_ID=asst_your-assistant-id
OPENAI_ORGANIZATION_ID=org-your-org-id

# Local blockchain (using Hardhat defaults)
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Development settings
LOG_LEVEL=info
NODE_ENV=development
ENABLE_BLOCKCHAIN_LOGGING=false
```

Remember to replace the OpenAI values with your actual credentials!