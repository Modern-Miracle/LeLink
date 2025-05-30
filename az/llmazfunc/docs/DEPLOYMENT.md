# Deployment Guide

## Overview

This guide covers deploying the LeLink Triage Assistant to production environments using Azure Functions.

## Prerequisites

- Azure subscription
- Azure CLI installed
- Node.js v20 installed
- OpenAI API account with Assistant configured

## Deployment Options

### 1. Azure Functions (Recommended)

#### Step 1: Install Azure CLI

```bash
# macOS
brew install azure-cli

# Windows
winget install Microsoft.AzureCLI

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

#### Step 2: Login to Azure

```bash
az login
az account set --subscription "Your Subscription Name"
```

#### Step 3: Create Resources

```bash
# Create resource group
az group create --name lekink-triage-rg --location eastus

# Create storage account
az storage account create \
  --name lekinktriagestorage \
  --resource-group lekink-triage-rg \
  --location eastus \
  --sku Standard_LRS

# Create function app
az functionapp create \
  --resource-group lekink-triage-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name lekink-triage-bot \
  --storage-account lekinktriagestorage
```

#### Step 4: Configure Application Settings

```bash
# Set OpenAI credentials
az functionapp config appsettings set \
  --name lekink-triage-bot \
  --resource-group lekink-triage-rg \
  --settings \
    "OPENAI_API_KEY=your-api-key" \
    "OPENAI_CONVERSATION_ASSISTANT_ID=your-assistant-id" \
    "OPENAI_ORGANIZATION_ID=your-org-id"
```

#### Step 5: Deploy Code

```bash
# Build the project
npm run build

# Deploy to Azure
func azure functionapp publish lekink-triage-bot
```

### 2. Docker Container

#### Create Dockerfile

Already included in the project. Review and modify if needed.

#### Build and Run

```bash
# Build image
docker build -t lekink-triage-bot .

# Run locally
docker run -p 7071:80 \
  -e OPENAI_API_KEY=your-key \
  -e OPENAI_CONVERSATION_ASSISTANT_ID=your-id \
  lekink-triage-bot
```

#### Deploy to Azure Container Instances

```bash
# Create container registry
az acr create \
  --resource-group lekink-triage-rg \
  --name lekinktriageacr \
  --sku Basic

# Login to registry
az acr login --name lekinktriageacr

# Tag and push image
docker tag lekink-triage-bot lekinktriageacr.azurecr.io/lekink-triage-bot:v1
docker push lekinktriageacr.azurecr.io/lekink-triage-bot:v1

# Create container instance
az container create \
  --resource-group lekink-triage-rg \
  --name lekink-triage-container \
  --image lekinktriageacr.azurecr.io/lekink-triage-bot:v1 \
  --dns-name-label lekink-triage \
  --ports 80 \
  --environment-variables \
    OPENAI_API_KEY=your-key \
    OPENAI_CONVERSATION_ASSISTANT_ID=your-id
```

## Environment Configuration

### Production Settings

Create production configuration:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=...",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "OPENAI_API_KEY": "@Microsoft.KeyVault(SecretUri=...)",
    "OPENAI_CONVERSATION_ASSISTANT_ID": "asst_production_id",
    "OPENAI_ORGANIZATION_ID": "org-production",
    "APPLICATION_INSIGHTS_CONNECTION_STRING": "InstrumentationKey=..."
  }
}
```

### Using Azure Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name lekink-triage-kv \
  --resource-group lekink-triage-rg \
  --location eastus

# Add secrets
az keyvault secret set \
  --vault-name lekink-triage-kv \
  --name OpenAIAPIKey \
  --value "your-api-key"

# Grant function app access
az keyvault set-policy \
  --name lekink-triage-kv \
  --object-id $(az functionapp identity show --name lekink-triage-bot --resource-group lekink-triage-rg --query principalId -o tsv) \
  --secret-permissions get
```

## Monitoring and Logging

### Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app lekink-triage-insights \
  --resource-group lekink-triage-rg \
  --location eastus

# Connect to Function App
az functionapp config appsettings set \
  --name lekink-triage-bot \
  --resource-group lekink-triage-rg \
  --settings "APPLICATIONINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show --app lekink-triage-insights --resource-group lekink-triage-rg --query connectionString -o tsv)"
```

### Log Queries

```kusto
// Recent errors
exceptions
| where timestamp > ago(1h)
| order by timestamp desc

// Request performance
requests
| where timestamp > ago(1h)
| summarize avg(duration), percentiles(duration, 50, 95, 99) by name
| order by avg_duration desc

// Resource generation tracking
customEvents
| where name == "ResourceGenerated"
| summarize count() by tostring(customDimensions.resourceType)
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure Functions

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to Azure
      uses: Azure/functions-action@v1
      with:
        app-name: lekink-triage-bot
        package: .
        publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

### Azure DevOps

```yaml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: Build
  jobs:
  - job: Build
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '20.x'
    
    - script: |
        npm ci
        npm test
      displayName: 'Install and test'
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '$(System.DefaultWorkingDirectory)'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'
    
    - publish: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
      artifact: drop

- stage: Deploy
  jobs:
  - deployment: Deploy
    environment: production
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureFunctionApp@1
            inputs:
              azureSubscription: 'Azure Service Connection'
              appType: 'functionApp'
              appName: 'lekink-triage-bot'
              package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
```

## Security Best Practices

1. **API Keys**: Always use Azure Key Vault
2. **Network**: Enable VNet integration if needed
3. **Authentication**: Implement Azure AD authentication
4. **CORS**: Configure allowed origins
5. **Rate Limiting**: Implement API Management

## Scaling Considerations

### Performance Optimization

1. **Cold Start**: Use Premium plan for consistent performance
2. **Concurrent Requests**: Configure host.json:
   ```json
   {
     "extensions": {
       "http": {
         "maxConcurrentRequests": 100
       }
     }
   }
   ```

3. **Memory**: Adjust function app settings:
   ```bash
   az functionapp config set \
     --name lekink-triage-bot \
     --resource-group lekink-triage-rg \
     --use-32bit-worker false
   ```

## Troubleshooting Deployment

### Common Issues

1. **Deployment Failed**
   ```bash
   # Check deployment logs
   az functionapp deployment list-publishing-profiles \
     --name lekink-triage-bot \
     --resource-group lekink-triage-rg
   ```

2. **Function Not Starting**
   ```bash
   # Check application logs
   az functionapp log tail \
     --name lekink-triage-bot \
     --resource-group lekink-triage-rg
   ```

3. **Environment Variables Missing**
   ```bash
   # List all settings
   az functionapp config appsettings list \
     --name lekink-triage-bot \
     --resource-group lekink-triage-rg
   ```

## Rollback Strategy

```bash
# List deployment slots
az functionapp deployment slot list \
  --name lekink-triage-bot \
  --resource-group lekink-triage-rg

# Swap slots
az functionapp deployment slot swap \
  --name lekink-triage-bot \
  --resource-group lekink-triage-rg \
  --slot staging \
  --target-slot production
```

## Health Checks

Configure health endpoint monitoring:

```bash
az monitor app-insights web-test create \
  --name lekink-health-check \
  --resource-group lekink-triage-rg \
  --app lekink-triage-insights \
  --location eastus \
  --kind ping \
  --frequency 300 \
  --timeout 30 \
  --enabled true \
  --url https://lekink-triage-bot.azurewebsites.net/api/symptomAssessmentBot
```