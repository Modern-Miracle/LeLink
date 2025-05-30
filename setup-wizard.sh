#!/bin/bash

# LeLink Backend Setup Wizard
# Interactive script to help users set up their environment

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Print functions
print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║              LeLink Backend Setup Wizard                       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Function to prompt for input with default value
prompt_with_default() {
    local prompt=$1
    local default=$2
    local var_name=$3
    
    if [ -n "$default" ]; then
        read -p "$(echo -e ${CYAN})$prompt [$default]: $(echo -e ${NC})" value
        value="${value:-$default}"
    else
        read -p "$(echo -e ${CYAN})$prompt: $(echo -e ${NC})" value
    fi
    
    eval "$var_name='$value'"
}

# Function to prompt for secret (hidden input)
prompt_secret() {
    local prompt=$1
    local var_name=$2
    
    echo -en "${CYAN}$prompt: ${NC}"
    read -s value
    echo ""
    eval "$var_name='$value'"
}

# Check if .env already exists
check_existing_env() {
    if [ -f ".env" ]; then
        print_warning ".env file already exists!"
        echo "What would you like to do?"
        echo "1) Backup existing .env and create new one"
        echo "2) Update existing .env"
        echo "3) Exit without changes"
        read -p "Choose option (1-3): " choice
        
        case $choice in
            1)
                backup_file=".env.backup.$(date +%Y%m%d%H%M%S)"
                cp .env "$backup_file"
                print_success "Existing .env backed up to $backup_file"
                > .env  # Clear the file
                ;;
            2)
                print_info "Will update existing values in .env"
                ;;
            3)
                print_info "Exiting without changes"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Exiting."
                exit 1
                ;;
        esac
    else
        # Copy from example if it exists
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
        else
            touch .env
            print_success "Created new .env file"
        fi
    fi
}

# Update or add environment variable in .env
update_env_var() {
    local key=$1
    local value=$2
    
    if grep -q "^$key=" .env; then
        # Update existing
        sed -i.bak "s|^$key=.*|$key=$value|" .env
        rm .env.bak
    else
        # Add new
        echo "$key=$value" >> .env
    fi
}

# Main setup wizard
main() {
    clear
    print_header
    
    print_info "This wizard will help you configure the LeLink backend services."
    print_info "Press Ctrl+C at any time to exit."
    echo ""
    
    # Check existing .env
    check_existing_env
    
    # Section 1: OpenAI Configuration
    print_section "1. OpenAI Configuration (Required for Medical Triage Bot)"
    
    print_info "You'll need an OpenAI API key and Assistant ID."
    print_info "Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    
    prompt_secret "Enter your OpenAI API Key" OPENAI_API_KEY
    prompt_with_default "Enter your OpenAI Assistant ID" "asst_your-assistant-id-here" OPENAI_ASSISTANT_ID
    prompt_with_default "Enter your OpenAI Organization ID" "org-your-organization-id-here" OPENAI_ORGANIZATION_ID
    
    # Save OpenAI settings
    update_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY"
    update_env_var "OPENAI_CONVERSATION_ASSISTANT_ID" "$OPENAI_ASSISTANT_ID"
    update_env_var "OPENAI_ORGANIZATION_ID" "$OPENAI_ORGANIZATION_ID"
    
    # Section 2: Blockchain Configuration
    print_section "2. Blockchain Configuration (For Smart Contract)"
    
    echo "Choose your deployment target:"
    echo "1) Local development (Hardhat)"
    echo "2) Sepolia testnet"
    echo "3) Ethereum mainnet"
    read -p "Select option (1-3) [1]: " blockchain_choice
    blockchain_choice="${blockchain_choice:-1}"
    
    case $blockchain_choice in
        1)
            print_success "Using local Hardhat network"
            update_env_var "BLOCKCHAIN_NETWORK" "localhost"
            update_env_var "BLOCKCHAIN_RPC_URL" "http://localhost:8545"
            # Use Hardhat's default account
            update_env_var "BLOCKCHAIN_PRIVATE_KEY" "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            ;;
        2)
            print_info "For Sepolia testnet, you'll need:"
            print_info "- An Infura/Alchemy project ID"
            print_info "- A funded testnet wallet"
            echo ""
            prompt_with_default "Enter your Infura/Alchemy project ID" "" INFURA_PROJECT_ID
            prompt_secret "Enter your testnet private key" TESTNET_PRIVATE_KEY
            
            update_env_var "BLOCKCHAIN_NETWORK" "sepolia"
            update_env_var "SEPOLIA_URL" "https://sepolia.infura.io/v3/$INFURA_PROJECT_ID"
            update_env_var "BLOCKCHAIN_RPC_URL" "https://sepolia.infura.io/v3/$INFURA_PROJECT_ID"
            update_env_var "TESTNET_PRIVATE_KEY" "$TESTNET_PRIVATE_KEY"
            update_env_var "BLOCKCHAIN_PRIVATE_KEY" "$TESTNET_PRIVATE_KEY"
            ;;
        3)
            print_warning "Mainnet deployment - be careful with real funds!"
            prompt_with_default "Enter your Infura/Alchemy project ID" "" INFURA_PROJECT_ID
            prompt_secret "Enter your mainnet private key" MAINNET_PRIVATE_KEY
            
            update_env_var "BLOCKCHAIN_NETWORK" "mainnet"
            update_env_var "MAINNET_URL" "https://mainnet.infura.io/v3/$INFURA_PROJECT_ID"
            update_env_var "BLOCKCHAIN_RPC_URL" "https://mainnet.infura.io/v3/$INFURA_PROJECT_ID"
            update_env_var "MAINNET_PRIVATE_KEY" "$MAINNET_PRIVATE_KEY"
            update_env_var "BLOCKCHAIN_PRIVATE_KEY" "$MAINNET_PRIVATE_KEY"
            ;;
    esac
    
    # Section 3: Optional Services
    print_section "3. Optional Services"
    
    read -p "Do you want to configure Etherscan API for contract verification? (y/N): " configure_etherscan
    if [[ "$configure_etherscan" =~ ^[Yy]$ ]]; then
        print_info "Get your API key from: https://etherscan.io/myapikey"
        prompt_with_default "Enter your Etherscan API Key" "" ETHERSCAN_API_KEY
        update_env_var "ETHERSCAN_API_KEY" "$ETHERSCAN_API_KEY"
    fi
    
    read -p "Do you want to enable gas reporting? (y/N): " enable_gas
    if [[ "$enable_gas" =~ ^[Yy]$ ]]; then
        update_env_var "REPORT_GAS" "true"
        print_info "Get your API key from: https://coinmarketcap.com/api/"
        prompt_with_default "Enter CoinMarketCap API Key (optional)" "" CMC_API_KEY
        if [ -n "$CMC_API_KEY" ]; then
            update_env_var "COINMARKETCAP_API_KEY" "$CMC_API_KEY"
        fi
    fi
    
    # Section 4: Integration Settings
    print_section "4. Integration Settings"
    
    read -p "Enable blockchain logging for FHIR resources? (y/N): " enable_blockchain
    if [[ "$enable_blockchain" =~ ^[Yy]$ ]]; then
        update_env_var "ENABLE_BLOCKCHAIN_LOGGING" "true"
        print_info "Blockchain logging will be enabled once the smart contract is deployed"
    else
        update_env_var "ENABLE_BLOCKCHAIN_LOGGING" "false"
    fi
    
    # FHIR Storage Configuration
    echo ""
    read -p "Configure FHIR storage for production? (y/N): " configure_fhir
    if [[ "$configure_fhir" =~ ^[Yy]$ ]]; then
        print_info "FHIR storage configuration for production"
        echo ""
        
        prompt_with_default "Enter your Azure FHIR Service URL" "https://your-fhir-server.azurehealthcareapis.com" FHIR_SERVER_URL
        update_env_var "FHIR_SERVER_URL" "$FHIR_SERVER_URL"
        
        echo ""
        echo "Choose authentication method:"
        echo "1) Managed Identity (DefaultAzureCredential)"
        echo "2) Service Principal"
        echo "3) Bearer Token (for testing)"
        read -p "Select option (1-3): " auth_choice
        
        case $auth_choice in
            1)
                print_success "Using Managed Identity authentication"
                update_env_var "FHIR_AUTH_TYPE" "managed-identity"
                print_info "DefaultAzureCredential will be used automatically"
                ;;
            2)
                print_info "Service Principal authentication selected"
                prompt_with_default "Enter Azure Tenant ID" "" AZURE_TENANT_ID
                prompt_with_default "Enter Azure Client ID" "" AZURE_CLIENT_ID
                prompt_secret "Enter Azure Client Secret" AZURE_CLIENT_SECRET
                
                update_env_var "FHIR_AUTH_TYPE" "service-principal"
                update_env_var "AZURE_TENANT_ID" "$AZURE_TENANT_ID"
                update_env_var "AZURE_CLIENT_ID" "$AZURE_CLIENT_ID"
                update_env_var "AZURE_CLIENT_SECRET" "$AZURE_CLIENT_SECRET"
                ;;
            3)
                print_warning "Bearer Token authentication is for testing only"
                prompt_secret "Enter Bearer Token" FHIR_SERVER_BEARER_TOKEN
                
                update_env_var "FHIR_AUTH_TYPE" "bearer-token"
                update_env_var "FHIR_SERVER_BEARER_TOKEN" "$FHIR_SERVER_BEARER_TOKEN"
                ;;
        esac
        
        update_env_var "ENABLE_FHIR_STORAGE" "true"
    fi
    
    # Section 5: Development Settings
    print_section "5. Development Settings"
    
    prompt_with_default "Log level (debug/info/warn/error)" "info" LOG_LEVEL
    prompt_with_default "Node environment (development/production)" "development" NODE_ENV
    
    update_env_var "LOG_LEVEL" "$LOG_LEVEL"
    update_env_var "NODE_ENV" "$NODE_ENV"
    
    # Summary
    print_section "Setup Complete!"
    
    print_success "Environment configuration saved to .env"
    echo ""
    echo "Next steps:"
    echo "1. Review your .env file to ensure all settings are correct"
    echo "2. Run ./startup.sh to start the services"
    echo "3. The smart contract will be deployed automatically on first run"
    echo ""
    
    read -p "Would you like to start the services now? (Y/n): " start_now
    if [[ ! "$start_now" =~ ^[Nn]$ ]]; then
        print_info "Starting LeLink services..."
        ./startup.sh
    else
        print_info "You can start the services later with: ./startup.sh"
    fi
}

# Run the wizard
main