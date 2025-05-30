#!/bin/bash

# LeLink Full Stack Development Startup Script
# This script starts the Smart Contract, Azure Functions, and Frontend services

set -e  # Exit on error

# Check if nvm is available and switch to Node 20
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use 20 2>/dev/null || nvm use 20.* 2>/dev/null || echo "Node 20 not found via nvm"
elif command -v fnm &> /dev/null; then
    fnm use 20 2>/dev/null || echo "Node 20 not found via fnm"
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

# Check if we're in the right directory
if [ ! -d "az" ] || [ ! -d "sc" ] || [ ! -d "fe" ]; then
    print_error "Please run this script from the lelink-full-app root directory"
    exit 1
fi

# Load environment variables if .env exists
if [ -f ".env" ]; then
    print_status "Loading environment variables from .env file..."
    set -a
    source .env
    set +a
else
    print_warning "No .env file found. Using default values or existing environment variables."
    print_info "To create one: cp .env.example .env"
fi

# Function to check required environment variables
check_env_vars() {
    local service=$1
    shift
    local required_vars=("$@")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
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
    for pid in "${PIDS[@]}"; do
        if ps -p $pid > /dev/null; then
            kill $pid 2>/dev/null || true
        fi
    done
    exit 0
}

# Set up trap for clean exit
trap cleanup SIGINT SIGTERM

# Start Smart Contract (if not skipped)
if [ "$SKIP_SMART_CONTRACT" = false ]; then
    print_status "Starting Smart Contract services..."
    
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
        CONTRACT_ADDRESS=$(cat "$DEPLOYMENT_FILE" | grep -o '"contractAddress": *"[^"]*"' | cut -d'"' -f4)
        print_status "Smart Contract deployed at: $CONTRACT_ADDRESS"
        
        # Update .env file with contract address
        if [ -f "../../.env" ]; then
            # Update existing .env
            sed -i.bak "s/^LELINK_CONTRACT_ADDRESS=.*/LELINK_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" ../../.env
            rm ../../.env.bak
        else
            # Create new .env with contract address
            echo "LELINK_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" > ../../.env
        fi
        
        # Export for current session
        export LELINK_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
    else
        print_warning "Could not find deployment file"
    fi
    
    cd ../..
fi

# Start Azure Functions (if not skipped)
if [ "$SKIP_AZURE_FUNCTIONS" = false ]; then
    print_status "Starting Azure Functions services..."
    
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
            print_status "Creating local.settings.json from example and environment variables..."
            cp config/local.settings.json.example config/local.settings.json
        else
            print_error "No local.settings.json.example file found!"
            exit 1
        fi
    fi
    
    # Update local.settings.json with environment variables if they exist
    if [ -n "$OPENAI_API_KEY" ] && [ -n "$OPENAI_CONVERSATION_ASSISTANT_ID" ] && [ -n "$OPENAI_ORGANIZATION_ID" ]; then
        print_status "Updating local.settings.json with environment variables..."
        # Use a temporary file for the update
        jq --arg key "$OPENAI_API_KEY" \
           --arg assistant "$OPENAI_CONVERSATION_ASSISTANT_ID" \
           --arg org "$OPENAI_ORGANIZATION_ID" \
           '.Values.OPENAI_API_KEY = $key | .Values.OPENAI_CONVERSATION_ASSISTANT_ID = $assistant | .Values.OPENAI_ORGANIZATION_ID = $org' \
           config/local.settings.json > config/local.settings.json.tmp && \
           mv config/local.settings.json.tmp config/local.settings.json
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
    
    cd fe/LL-next
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing Frontend dependencies..."
        npm install
    fi
    
    # Set frontend environment variables
    if [ -n "$CONTRACT_ADDRESS" ]; then
        export NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
    fi
    export NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=${BLOCKCHAIN_RPC_URL:-http://localhost:8545}
    
    # Generate AUTH_SECRET if not set
    if [ -z "$AUTH_SECRET" ]; then
        export AUTH_SECRET=$(openssl rand -base64 32)
        print_status "Generated AUTH_SECRET for NextAuth.js"
    fi
    
    # Export External ID environment variables for frontend
    if [ -n "$ENTRA_EXTERNAL_TENANT_ID" ]; then
        export ENTRA_EXTERNAL_TENANT_ID=$ENTRA_EXTERNAL_TENANT_ID
        export ENTRA_EXTERNAL_TENANT_NAME=$ENTRA_EXTERNAL_TENANT_NAME
        export ENTRA_EXTERNAL_CLIENT_ID=$ENTRA_EXTERNAL_CLIENT_ID
        export ENTRA_EXTERNAL_CLIENT_SECRET=$ENTRA_EXTERNAL_CLIENT_SECRET
        print_status "External ID environment variables configured"
    fi
    
    # Check if port 3000 is available
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port 3000 is already in use. Using port 3001 for frontend."
        export PORT=3001
    else
        export PORT=3000
    fi
    
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
if [ "$ENABLE_BLOCKCHAIN_LOGGING" = "true" ]; then
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