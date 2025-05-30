#!/bin/bash

# Enhanced test-all.sh with setup wizard for production FHIR configuration
# Usage: ./test-all.sh [number-of-scenarios] [--no-export]
#
# Options:
#   [number-of-scenarios] - Number of scenarios to run (optional)
#   --no-export           - Skip exporting FHIR resources (optional)
#   --wizard              - Run configuration wizard
#   --help                - Show help message
#
# By default, this script will run all test scenarios and export
# all generated FHIR resources to JSON files.

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
    echo -e "${CYAN}║              LeLink Bot Test System                            ║${NC}"
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

# Update or add environment variable in .env
update_env_var() {
    local key=$1
    local value=$2
    local env_file="${3:-../../.env}"
    
    if grep -q "^$key=" "$env_file"; then
        # Update existing
        sed -i.bak "s|^$key=.*|$key=$value|" "$env_file"
        rm "${env_file}.bak"
    else
        # Add new
        echo "$key=$value" >> "$env_file"
    fi
}

# Check environment and run wizard if needed
check_environment() {
    local env_file="../../.env"
    
    # Check if we're in production mode
    if [ -f "$env_file" ]; then
        source "$env_file"
    fi
    
    # If NODE_ENV is production and FHIR configuration is missing, run wizard
    if [ "$NODE_ENV" = "production" ]; then
        if [ -z "$FHIR_SERVER_URL" ] || [ -z "$FHIR_AUTH_TYPE" ]; then
            print_warning "Production mode detected but FHIR service is not configured"
            echo ""
            read -p "Would you like to configure FHIR service now? (Y/n): " configure_fhir
            if [[ ! "$configure_fhir" =~ ^[Nn]$ ]]; then
                configure_fhir_service
            fi
        fi
    fi
}

# FHIR Service Configuration Wizard
configure_fhir_service() {
    print_section "FHIR Service Configuration for Production"
    
    print_info "This wizard will help you configure Azure FHIR Service for production use."
    print_info "You'll need your FHIR service URL and authentication credentials."
    echo ""
    
    # FHIR Service URL
    prompt_with_default "Enter your Azure FHIR Service URL" "https://your-fhir-server.azurehealthcareapis.com" FHIR_SERVER_URL
    update_env_var "FHIR_SERVER_URL" "$FHIR_SERVER_URL" "../../.env"
    
    # Authentication Method
    echo ""
    echo "Choose authentication method:"
    echo "1) Managed Identity (DefaultAzureCredential)"
    echo "2) Service Principal"
    echo "3) Bearer Token (for testing)"
    read -p "Select option (1-3): " auth_choice
    
    case $auth_choice in
        1)
            print_success "Using Managed Identity authentication"
            update_env_var "FHIR_AUTH_TYPE" "managed-identity" "../../.env"
            print_info "DefaultAzureCredential will be used automatically"
            print_info "Ensure your Azure Function has a managed identity assigned"
            ;;
        2)
            print_info "Service Principal authentication selected"
            echo ""
            
            # Service Principal credentials
            prompt_with_default "Enter Azure Tenant ID" "" AZURE_TENANT_ID
            prompt_with_default "Enter Azure Client ID (Application ID)" "" AZURE_CLIENT_ID
            prompt_secret "Enter Azure Client Secret" AZURE_CLIENT_SECRET
            
            # Optional: Subscription ID for resource-specific operations
            echo ""
            read -p "Do you need to specify a Subscription ID? (y/N): " need_subscription
            if [[ "$need_subscription" =~ ^[Yy]$ ]]; then
                prompt_with_default "Enter Azure Subscription ID" "" AZURE_SUBSCRIPTION_ID
                update_env_var "AZURE_SUBSCRIPTION_ID" "$AZURE_SUBSCRIPTION_ID" "../../.env"
            fi
            
            # Save Service Principal settings
            update_env_var "FHIR_AUTH_TYPE" "service-principal" "../../.env"
            update_env_var "AZURE_TENANT_ID" "$AZURE_TENANT_ID" "../../.env"
            update_env_var "AZURE_CLIENT_ID" "$AZURE_CLIENT_ID" "../../.env"
            update_env_var "AZURE_CLIENT_SECRET" "$AZURE_CLIENT_SECRET" "../../.env"
            
            print_success "Service Principal configuration saved"
            ;;
        3)
            print_warning "Bearer Token authentication is for testing only"
            echo ""
            prompt_secret "Enter Bearer Token" FHIR_SERVER_BEARER_TOKEN
            
            update_env_var "FHIR_AUTH_TYPE" "bearer-token" "../../.env"
            update_env_var "FHIR_SERVER_BEARER_TOKEN" "$FHIR_SERVER_BEARER_TOKEN" "../../.env"
            ;;
        *)
            print_error "Invalid choice. Using Bearer Token as default."
            update_env_var "FHIR_AUTH_TYPE" "bearer-token" "../../.env"
            ;;
    esac
    
    # Additional FHIR settings
    print_section "Additional FHIR Settings"
    
    read -p "Enable FHIR resource validation? (Y/n): " enable_validation
    if [[ ! "$enable_validation" =~ ^[Nn]$ ]]; then
        update_env_var "FHIR_VALIDATE_RESOURCES" "true" "../../.env"
    else
        update_env_var "FHIR_VALIDATE_RESOURCES" "false" "../../.env"
    fi
    
    read -p "Enable FHIR audit logging? (Y/n): " enable_audit
    if [[ ! "$enable_audit" =~ ^[Nn]$ ]]; then
        update_env_var "FHIR_AUDIT_ENABLED" "true" "../../.env"
    else
        update_env_var "FHIR_AUDIT_ENABLED" "false" "../../.env"
    fi
    
    # Test connection
    echo ""
    read -p "Would you like to test the FHIR service connection? (Y/n): " test_connection
    if [[ ! "$test_connection" =~ ^[Nn]$ ]]; then
        print_info "Testing FHIR service connection..."
        # Note: Actual connection test would be done by the Node.js script
        echo "Connection test will be performed when starting the test..."
    fi
    
    print_success "FHIR service configuration complete!"
}

# Show help message
show_help() {
    print_header
    echo "Usage: ./test-all.sh [options] [number-of-scenarios]"
    echo ""
    echo "Options:"
    echo "  --wizard              Run configuration wizard"
    echo "  --no-export           Skip exporting FHIR resources"
    echo "  --help                Show this help message"
    echo ""
    echo "Environment Modes:"
    echo "  Development (default) - Uses Azurite for FHIR storage"
    echo "  Production           - Uses Azure FHIR Service"
    echo ""
    echo "To run in production mode:"
    echo "  NODE_ENV=production ./test-all.sh"
    echo ""
    echo "Examples:"
    echo "  ./test-all.sh                    # Run all scenarios in dev mode"
    echo "  ./test-all.sh 5                  # Run 5 scenarios"
    echo "  ./test-all.sh --wizard           # Configure FHIR service"
    echo "  NODE_ENV=production ./test-all.sh # Run in production mode"
}

# Main script logic
main() {
    # Parse command line arguments
    local run_wizard=false
    local args=()
    
    for arg in "$@"; do
        case $arg in
            --wizard)
                run_wizard=true
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                args+=("$arg")
                ;;
        esac
    done
    
    # Set current directory to the script's directory
    cd "$(dirname "$0")/../.."
    
    # Show header
    print_header
    
    # Run wizard if requested
    if [ "$run_wizard" = true ]; then
        configure_fhir_service
        echo ""
        read -p "Would you like to run the tests now? (Y/n): " run_tests
        if [[ "$run_tests" =~ ^[Nn]$ ]]; then
            exit 0
        fi
    fi
    
    # Check environment
    check_environment
    
    # Check if node is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js to run this script."
        exit 1
    fi
    
    # Check for local.settings.json
    if [ ! -f "local.settings.json" ]; then
        print_error "local.settings.json not found. Please create this file with proper configuration."
        exit 1
    fi
    
    # Display current mode
    if [ "$NODE_ENV" = "production" ]; then
        print_info "Running in PRODUCTION mode - Using Azure FHIR Service"
    else
        print_info "Running in DEVELOPMENT mode - Using Azurite storage"
    fi
    
    # Check if nvm is available and handle Node.js v20
    if [ -n "$NVM_DIR" ] || [ -f "$HOME/.nvm/nvm.sh" ]; then
        # Load nvm if available
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"
        
        # Check if Node v20 is installed
        if nvm list | grep -q "v20"; then
            print_info "Switching to Node.js v20 for Azure Functions compatibility..."
            nvm use 20.18.1 || nvm use 20
            
            # Check if Azurite is needed (development mode only)
            if [ "$NODE_ENV" != "production" ] && ! command -v azurite &> /dev/null; then
                print_warning "Azurite not found in Node v20 environment."
                echo "Installing Azurite in Node v20..."
                
                # Ask user for preference
                echo "How would you like to run Azurite?"
                echo "1) Install globally in Node v20 (npm install -g azurite)"
                echo "2) Use npx to run Azurite (downloads automatically)"
                echo "3) Continue without installing (assumes Azurite is already running)"
                read -p "Choose option (1/2/3): " choice
                
                case $choice in
                    1)
                        npm install -g azurite
                        node scripts/test/runBotTest.js "${args[@]}"
                        ;;
                    2)
                        node scripts/test/runBotTest.js --use-npx "${args[@]}"
                        ;;
                    3)
                        node scripts/test/runBotTest.js "${args[@]}"
                        ;;
                    *)
                        print_warning "Invalid choice. Using npx by default..."
                        node scripts/test/runBotTest.js --use-npx "${args[@]}"
                        ;;
                esac
            else
                # Azurite is available or not needed, run normally
                node scripts/test/runBotTest.js "${args[@]}"
            fi
        else
            print_warning "Node.js v20 not found. Azure Functions works best with Node.js v20."
            echo "Install it with: nvm install 20.18.1"
            node scripts/test/runBotTest.js "${args[@]}"
        fi
    else
        # No nvm, just run the script
        print_info "Starting bot test system..."
        node scripts/test/runBotTest.js "${args[@]}"
    fi
}

# Run main function
main "$@"