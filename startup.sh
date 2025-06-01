#!/bin/bash

# LeLink Full Stack Development Startup Script - Security Hardened Version
# This script starts the Smart Contract, Azure Functions, and Frontend services

set -e  # Exit on error
set -u  # Exit on undefined variables
set -o pipefail  # Exit on pipe failures

# Security: Validate we're in the expected directory structure
if [ ! -d "az" ] || [ ! -d "sc" ] || [ ! -d "fe" ]; then
    echo "Error: Please run this script from the lelink-full-app root directory" >&2
    exit 1
fi

# Security: Create logs directory with proper permissions
mkdir -p logs
chmod 755 logs

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[LeLink Startup]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[Warning]${NC} $1"
}

print_error() {
    echo -e "${RED}[Error]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[Info]${NC} $1"
}

# Security: Function to validate environment variable content
validate_env_var() {
    local var_name="$1"
    local var_value="$2"
    
    # Check for shell metacharacters that could be dangerous
    if [[ "$var_value" =~ [\;\|\&\$\`] ]]; then
        print_error "Environment variable $var_name contains potentially dangerous characters"
        return 1
    fi
    
    # Check length (prevent buffer overflow style attacks)
    if [ ${#var_value} -gt 1000 ]; then
        print_error "Environment variable $var_name is suspiciously long"
        return 1
    fi
    
    return 0
}

# Security: Check and install required dependencies
check_and_install_jq() {
    if ! command -v jq >/dev/null 2>&1; then
        print_warning "jq not found. This is optional but recommended for better JSON parsing."
        
        # Only attempt installation if user has sudo access
        if command -v sudo >/dev/null 2>&1; then
            read -p "Would you like to install jq automatically? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if command -v apt-get >/dev/null 2>&1; then
                    print_status "Installing jq using apt-get..."
                    sudo apt-get update && sudo apt-get install -y jq
                elif command -v yum >/dev/null 2>&1; then
                    print_status "Installing jq using yum..."
                    sudo yum install -y jq
                elif command -v dnf >/dev/null 2>&1; then
                    print_status "Installing jq using dnf..."
                    sudo dnf install -y jq
                elif command -v pacman >/dev/null 2>&1; then
                    print_status "Installing jq using pacman..."
                    sudo pacman -S --noconfirm jq
                elif command -v brew >/dev/null 2>&1; then
                    print_status "Installing jq using brew..."
                    brew install jq
                else
                    print_warning "Cannot automatically install jq on this system."
                fi
            fi
        fi
        
        # Check if installation was successful
        if command -v jq >/dev/null 2>&1; then
            print_status "jq is now available"
        else
            print_info "jq not installed. The script will use fallback methods."
            print_info "To install jq manually:"
            print_info "  Ubuntu/Debian: sudo apt-get install jq"
            print_info "  CentOS/RHEL: sudo yum install jq"
            print_info "  macOS: brew install jq"
        fi
    fi
}

# Security: Safe .env loading function
load_env_file() {
    local env_file="$1"
    
    if [ ! -f "$env_file" ]; then
        return 0
    fi
    
    print_status "Loading environment variables from $env_file..."
    
    # Security: Parse .env file safely without executing it
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^[[:space:]]*# ]] && continue
        [[ -z $key ]] && continue
        
        # Remove quotes if present
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        # Validate the variable content
        if validate_env_var "$key" "$value"; then
            export "$key"="$value"
        else
            print_error "Skipping potentially dangerous variable: $key"
        fi
    done < <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$env_file" || true)
}

# Load environment variables safely
load_env_file ".env"

# Check for jq (non-blocking)
check_and_install_jq

# Check if nvm is available and switch to Node 20
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use 20 2>/dev/null || nvm use 20.* 2>/dev/null || echo "Node 20 not found via nvm"
elif command -v fnm &> /dev/null; then
    fnm use 20 2>/dev/null || echo "Node 20 not found via fnm"
fi

# Function to check required environment variables
check_env_vars() {
    local service=$1
    shift
    local required_vars=("$@")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required environment variables for $service:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    return 0
}

# Parse command line arguments
SKIP_SMART_CONTRACT=false
SKIP_AZURE_FUNCTIONS=false
SKIP_FRONTEND=false
RUN_TESTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-sc|--skip-smart-contract)
            SKIP_SMART_CONTRACT=true
            shift
            ;;
        --skip-az|--skip-azure-functions)
            SKIP_AZURE_FUNCTIONS=true
            shift
            ;;
        --skip-fe|--skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --test)
            RUN_TESTS=true
            shift
            ;;
        --help|-h)
            echo "LeLink Full Stack Startup Script"
            echo ""
            echo "Usage: ./startup.sh [options]"
            echo ""
            echo "Options:"
            echo "  --skip-sc, --skip-smart-contract    Skip starting the smart contract"
            echo "  --skip-az, --skip-azure-functions   Skip starting Azure Functions"
            echo "  --skip-fe, --skip-frontend          Skip starting the frontend"
            echo "  --test                              Run tests after startup"
            echo "  --help, -h                          Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./startup.sh                        Start all services"
            echo "  ./startup.sh --skip-sc              Start Azure Functions and Frontend"
            echo "  ./startup.sh --skip-fe              Start only backend services"
            echo "  ./startup.sh --test                 Start services and run tests"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Track PIDs for cleanup
PIDS=()

# Function to clean up on exit
cleanup() {
    print_status "Shutting down services..."
    
    # Kill tracked PIDs first
    for pid in "${PIDS[@]}"; do
        # Security: Validate PID belongs to current user before killing
        if ps -p "$pid" -o uid= 2>/dev/null | grep -q "^$(id -u)$"; then
            print_info "Stopping process $pid..."
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    # Wait a moment for processes to terminate gracefully
    sleep 2
    
    # Kill any remaining child processes
    local child_pids=$(jobs -p 2>/dev/null)
    if [ -n "$child_pids" ]; then
        for pid in $child_pids; do
            kill "$pid" 2>/dev/null || true
        done
    fi
    
    # Kill processes on specific ports
    print_info "Cleaning up processes on service ports..."
    
    # Smart Contract (Hardhat) - port 8545
    if [ "$SKIP_SMART_CONTRACT" = false ]; then
        if command -v lsof >/dev/null 2>&1; then
            lsof -ti:8545 2>/dev/null | xargs -r kill -9 2>/dev/null || true
        elif command -v fuser >/dev/null 2>&1; then
            fuser -k 8545/tcp 2>/dev/null || true
        fi
    fi
    
    # Azure Functions - port 7071
    if [ "$SKIP_AZURE_FUNCTIONS" = false ]; then
        if command -v lsof >/dev/null 2>&1; then
            lsof -ti:7071 2>/dev/null | xargs -r kill -9 2>/dev/null || true
        elif command -v fuser >/dev/null 2>&1; then
            fuser -k 7071/tcp 2>/dev/null || true
        fi
        
        # Also kill func host processes
        pkill -f "func host start" 2>/dev/null || true
        pkill -f "azure-functions-core-tools" 2>/dev/null || true
    fi
    
    # Frontend - ports 3000/3001
    if [ "$SKIP_FRONTEND" = false ]; then
        if command -v lsof >/dev/null 2>&1; then
            lsof -ti:3000 2>/dev/null | xargs -r kill -9 2>/dev/null || true
            lsof -ti:3001 2>/dev/null | xargs -r kill -9 2>/dev/null || true
        elif command -v fuser >/dev/null 2>&1; then
            fuser -k 3000/tcp 2>/dev/null || true
            fuser -k 3001/tcp 2>/dev/null || true
        fi
        
        # Kill Next.js dev server processes
        pkill -f "next dev" 2>/dev/null || true
    fi
    
    # Kill any npm processes started by this script
    pkill -P $$ 2>/dev/null || true
    
    print_status "All services have been shut down."
    exit 0
}

# Set up trap for clean exit
trap cleanup SIGINT SIGTERM

# Security: Function to safely update .env file
safe_update_env() {
    local key="$1"
    local value="$2"
    local env_file="${3:-.env}"
    
    # Validate inputs
    if ! validate_env_var "$key" "$value"; then
        print_error "Cannot update .env with potentially dangerous value for $key"
        return 1
    fi
    
    # Create a temporary file with proper permissions
    local temp_file
    temp_file=$(mktemp)
    chmod 600 "$temp_file"
    
    # Update or add the variable
    if [ -f "$env_file" ]; then
        # Remove existing key and add new one
        grep -v "^${key}=" "$env_file" > "$temp_file" || true
    fi
    
    printf "%s=%s\n" "$key" "$value" >> "$temp_file"
    
    # Atomically replace the file
    mv "$temp_file" "$env_file"
    chmod 600 "$env_file"
}

# Security: Function to safely update JSON config
safe_update_json() {
    local config_file="$1"
    local openai_key="${OPENAI_API_KEY:-}"
    local assistant_id="${OPENAI_CONVERSATION_ASSISTANT_ID:-}"
    local org_id="${OPENAI_ORGANIZATION_ID:-}"
    
    # Validate inputs
    for var in "$openai_key" "$assistant_id" "$org_id"; do
        if [ -n "$var" ] && ! validate_env_var "config_value" "$var"; then
            print_error "Cannot update config with potentially dangerous values"
            return 1
        fi
    done
    
    # Create temporary file with proper permissions
    local temp_file
    temp_file=$(mktemp)
    chmod 600 "$temp_file"
    
    # Try jq first, then fallback to manual JSON creation
    if command -v jq >/dev/null 2>&1; then
        # Use jq with proper error handling
        if ! jq --arg key "$openai_key" \
               --arg assistant "$assistant_id" \
               --arg org "$org_id" \
               '.Values.OPENAI_API_KEY = $key | .Values.OPENAI_CONVERSATION_ASSISTANT_ID = $assistant | .Values.OPENAI_ORGANIZATION_ID = $org' \
               "$config_file" > "$temp_file"; then
            print_error "Failed to update JSON configuration with jq"
            rm -f "$temp_file"
            return 1
        fi
    else
        # Fallback: Manual JSON update using sed
        print_warning "jq not available, using fallback method for JSON update"
        
        if [ ! -f "$config_file" ]; then
            print_error "Config file not found for manual update"
            rm -f "$temp_file"
            return 1
        fi
        
        # Copy original file and update values using sed
        cp "$config_file" "$temp_file"
        
        # Escape special characters for sed
        openai_key_escaped=$(printf '%s\n' "$openai_key" | sed 's/[[\.*^$()+?{|]/\\&/g')
        assistant_id_escaped=$(printf '%s\n' "$assistant_id" | sed 's/[[\.*^$()+?{|]/\\&/g')
        org_id_escaped=$(printf '%s\n' "$org_id" | sed 's/[[\.*^$()+?{|]/\\&/g')
        
        # Update the JSON values using sed
        sed -i "s/\"OPENAI_API_KEY\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"OPENAI_API_KEY\": \"$openai_key_escaped\"/g" "$temp_file"
        sed -i "s/\"OPENAI_CONVERSATION_ASSISTANT_ID\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"OPENAI_CONVERSATION_ASSISTANT_ID\": \"$assistant_id_escaped\"/g" "$temp_file"
        sed -i "s/\"OPENAI_ORGANIZATION_ID\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"OPENAI_ORGANIZATION_ID\": \"$org_id_escaped\"/g" "$temp_file"
    fi
    
    # Atomically replace the file
    mv "$temp_file" "$config_file"
    chmod 600 "$config_file"
}

# Security: Function to extract contract address from JSON
extract_contract_address() {
    local deployment_file="$1"
    
    if [ ! -f "$deployment_file" ]; then
        return 1
    fi
    
    local contract_address=""
    
    # Try jq first, then fallback methods
    if command -v jq >/dev/null 2>&1; then
        contract_address=$(jq -r '.contractAddress // empty' "$deployment_file" 2>/dev/null)
    else
        # Fallback: Use grep and sed to extract contract address
        contract_address=$(grep -o '"contractAddress"[[:space:]]*:[[:space:]]*"[^"]*"' "$deployment_file" 2>/dev/null | \
                          sed 's/.*"contractAddress"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' 2>/dev/null)
    fi
    
    # Validate the extracted address
    if [ -n "$contract_address" ] && [ "$contract_address" != "null" ] && [ "$contract_address" != "empty" ]; then
        echo "$contract_address"
        return 0
    fi
    
    return 1
}

# Start Smart Contract (if not skipped)
if [ "$SKIP_SMART_CONTRACT" = false ]; then
    print_status "Starting Smart Contract services..."
    
    # Clean up any existing Hardhat processes before starting
    print_info "Cleaning up any existing Hardhat processes..."
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:8545 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k 8545/tcp 2>/dev/null || true
    fi
    pkill -f "hardhat node" 2>/dev/null || true
    sleep 2  # Give processes time to die
    
    cd sc/LeLink-SC
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing Smart Contract dependencies..."
        npm install
    fi
    
    # Compile contracts
    print_status "Compiling Smart Contracts..."
    npm run compile
    
    # Start Hardhat node in background
    print_status "Starting Hardhat node..."
    npm run node 2>&1 | tee ../../logs/hardhat-node.log | sed 's/^/[Hardhat] /' &
    HARDHAT_PID=$!
    PIDS+=($HARDHAT_PID)
    
    # Wait for Hardhat to start
    print_status "Waiting for Hardhat node to start..."
    sleep 5
    
    # Deploy contract to localhost
    print_status "Deploying LeLink Smart Contract to localhost..."
    npm run deploy:localhost
    
    # Extract contract address from deployment
    DEPLOYMENT_FILE=$(ls deployments/localhost-*.json 2>/dev/null | tail -1)
    if [ -f "$DEPLOYMENT_FILE" ]; then
        CONTRACT_ADDRESS=$(extract_contract_address "$DEPLOYMENT_FILE")
        if [ -n "$CONTRACT_ADDRESS" ] && [ "$CONTRACT_ADDRESS" != "null" ]; then
            print_status "Smart Contract deployed at: $CONTRACT_ADDRESS"
            
            # Security: Safely update .env file
            safe_update_env "LELINK_CONTRACT_ADDRESS" "$CONTRACT_ADDRESS" "../../.env"
            
            # Export for current session
            export LELINK_CONTRACT_ADDRESS="$CONTRACT_ADDRESS"
        else
            print_warning "Could not extract contract address from deployment file"
        fi
    else
        print_warning "Could not find deployment file"
    fi
    
    cd ../..
fi

# Start Azure Functions (if not skipped)
if [ "$SKIP_AZURE_FUNCTIONS" = false ]; then
    print_status "Starting Azure Functions services..."
    
    # Clean up any existing Azure Functions processes before starting
    print_info "Cleaning up any existing Azure Functions processes..."
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:7071 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k 7071/tcp 2>/dev/null || true
    fi
    pkill -f "func host start" 2>/dev/null || true
    pkill -f "azure-functions-core-tools" 2>/dev/null || true
    sleep 2  # Give processes time to die
    
    # Check required environment variables
    AZURE_REQUIRED_VARS=("OPENAI_API_KEY" "OPENAI_CONVERSATION_ASSISTANT_ID" "OPENAI_ORGANIZATION_ID")
    if ! check_env_vars "Azure Functions" "${AZURE_REQUIRED_VARS[@]}"; then
        print_info "These variables are required for the medical triage bot to function."
        print_info "You can set them in the .env file or config/local.settings.json"
        print_warning "Continuing anyway, but the bot may not work properly."
    fi
    
    cd az/llmazfunc
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing Azure Functions dependencies..."
        npm install
    fi
    
    # Update or create local.settings.json from environment variables
    if [ ! -f "config/local.settings.json" ]; then
        if [ -f "config/local.settings.json.example" ]; then
            print_status "Creating local.settings.json from example..."
            cp config/local.settings.json.example config/local.settings.json
            chmod 600 config/local.settings.json
        else
            print_error "No local.settings.json.example file found!"
            exit 1
        fi
    fi
    
    # Security: Safely update local.settings.json with environment variables
    if [ -n "${OPENAI_API_KEY:-}" ] && [ -n "${OPENAI_CONVERSATION_ASSISTANT_ID:-}" ] && [ -n "${OPENAI_ORGANIZATION_ID:-}" ]; then
        print_status "Updating local.settings.json with environment variables..."
        safe_update_json "config/local.settings.json"
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" != "20" ]; then
        print_warning "Azure Functions works best with Node.js v20. Current version: $(node -v)"
    fi
    
    # Start Azure Functions
    print_status "Starting Azure Functions..."
    ./scripts/start/start.sh 2>&1 | tee ../../logs/azure-functions.log | sed 's/^/[Azure] /' &
    AZURE_FUNC_PID=$!
    PIDS+=($AZURE_FUNC_PID)
    
    print_status "Waiting for Azure Functions to start (30 seconds)..."
    sleep 30
    
    cd ../..
fi

# Start Frontend (if not skipped)
if [ "$SKIP_FRONTEND" = false ]; then
    print_status "Starting Frontend services..."
    
    # Clean up any existing Next.js processes before starting
    print_info "Cleaning up any existing Next.js processes..."
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:3000 2>/dev/null | xargs -r kill -9 2>/dev/null || true
        lsof -ti:3001 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k 3000/tcp 2>/dev/null || true
        fuser -k 3001/tcp 2>/dev/null || true
    fi
    pkill -f "next dev" 2>/dev/null || true
    sleep 2  # Give processes time to die
    
    cd fe/LL-next
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing Frontend dependencies..."
        npm install
    fi
    
    # Set frontend environment variables safely
    if [ -n "${CONTRACT_ADDRESS:-}" ]; then
        export NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS="$CONTRACT_ADDRESS"
    fi
    export NEXT_PUBLIC_BLOCKCHAIN_RPC_URL="${BLOCKCHAIN_RPC_URL:-http://localhost:8545}"
    
    # Generate AUTH_SECRET if not set
    if [ -z "${AUTH_SECRET:-}" ]; then
        if command -v openssl >/dev/null 2>&1; then
            AUTH_SECRET=$(openssl rand -base64 32)
            export AUTH_SECRET
            print_status "Generated AUTH_SECRET for NextAuth.js"
        else
            print_error "OpenSSL not found. Cannot generate AUTH_SECRET."
            exit 1
        fi
    fi
    
    # Export External ID environment variables for frontend
    if [ -n "${ENTRA_EXTERNAL_TENANT_ID:-}" ]; then
        export ENTRA_EXTERNAL_TENANT_ID="${ENTRA_EXTERNAL_TENANT_ID}"
        export ENTRA_EXTERNAL_TENANT_NAME="${ENTRA_EXTERNAL_TENANT_NAME:-}"
        export ENTRA_EXTERNAL_CLIENT_ID="${ENTRA_EXTERNAL_CLIENT_ID:-}"
        export ENTRA_EXTERNAL_CLIENT_SECRET="${ENTRA_EXTERNAL_CLIENT_SECRET:-}"
        print_status "External ID environment variables configured"
    fi
    
    # Use default port 3000 since we cleaned it up
    export PORT=3000
    
    # Start Next.js in development mode
    print_status "Starting Next.js frontend on port $PORT..."
    npm run dev 2>&1 | tee ../../logs/frontend.log | sed 's/^/[Frontend] /' &
    FRONTEND_PID=$!
    PIDS+=($FRONTEND_PID)
    
    print_status "Waiting for Frontend to start..."
    sleep 10
    
    cd ../..
fi

# Display status
echo ""
print_status "===== LeLink Full Stack Services Started ====="
echo ""

if [ "$SKIP_SMART_CONTRACT" = false ]; then
    echo -e "${GREEN}Smart Contract:${NC}"
    echo "  - Hardhat Node: http://localhost:8545"
    echo "  - Contract Address: ${CONTRACT_ADDRESS:-Check logs for address}"
    echo "  - Logs: logs/hardhat-node.log"
    echo ""
fi

if [ "$SKIP_AZURE_FUNCTIONS" = false ]; then
    echo -e "${GREEN}Azure Functions:${NC}"
    echo "  - HTTP Endpoint: http://localhost:7071/api/symptomAssessmentBot"
    echo "  - Logs: logs/azure-functions.log"
    echo ""
fi

if [ "$SKIP_FRONTEND" = false ]; then
    echo -e "${GREEN}Frontend (Next.js):${NC}"
    echo "  - Web Interface: http://localhost:${PORT:-3000}"
    echo "  - PWA Enabled: Install as app from Chrome menu"
    echo "  - Logs: logs/frontend.log"
    echo ""
fi

# Run tests if requested
if [ "$RUN_TESTS" = true ]; then
    print_status "Running tests..."
    
    if [ "$SKIP_SMART_CONTRACT" = false ]; then
        print_status "Running Smart Contract tests..."
        cd sc/LeLink-SC
        npm test
        cd ../..
    fi
    
    if [ "$SKIP_AZURE_FUNCTIONS" = false ]; then
        print_status "Running Azure Functions tests..."
        cd az/llmazfunc
        npm test
        cd ../..
    fi
fi

print_status "Services are running. Press Ctrl+C to stop all services."
echo ""

# Integration status
if [ "${ENABLE_BLOCKCHAIN_LOGGING:-}" = "true" ]; then
    echo -e "${GREEN}✅ Integration Status:${NC}"
    echo "The systems are integrated! FHIR resources from the medical triage bot"
    echo "will be automatically logged to the blockchain at contract address:"
    echo "${CONTRACT_ADDRESS:-Will be set after deployment}"
    echo ""
    echo -e "${YELLOW}Testing the Integration:${NC}"
    echo "1. Open a new terminal and run: ${GREEN}./run-testbot.sh${NC}"
    echo "2. Or send manual POST requests to http://localhost:7071/api/symptomAssessmentBot"
    if [ "$SKIP_FRONTEND" = false ]; then
        echo "3. Use the web interface at http://localhost:${PORT:-3000}/dashboard/triage"
    fi
    echo "4. Watch for triage interactions and blockchain logging in the output"
else
    echo -e "${YELLOW}Integration Notes:${NC}"
    echo "Blockchain logging is disabled. To enable integration:"
    echo "1. Set ENABLE_BLOCKCHAIN_LOGGING=true in your .env file"
    echo "2. Restart the services"
fi

if [ "$SKIP_FRONTEND" = false ]; then
    echo ""
    echo -e "${CYAN}Frontend Features:${NC}"
    echo "• PWA with offline support - works without internet"
    echo "• Patient data cached locally for offline access"
    echo "• Install as app: Chrome menu → 'Install LeLink Healthcare'"
fi
echo ""

# Keep script running
wait 
