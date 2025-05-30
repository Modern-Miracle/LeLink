#!/bin/bash

# LeLink Full Stack Development Startup Script with Live Logs
# This script starts all services and shows live logs in the terminal

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
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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
if [ ! -d "az" ] || [ ! -d "sc" ]; then
    print_error "Please run this script from the lelink-backend root directory"
    exit 1
fi

# Load environment variables if .env exists
if [ -f ".env" ]; then
    print_status "Loading environment variables from .env file..."
    set -a
    source .env
    set +a
else
    print_warning "No .env file found. Run ./setup-wizard.sh first!"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Parse command line arguments
SKIP_SMART_CONTRACT=false
SKIP_AZURE_FUNCTIONS=false
SKIP_FRONTEND=false

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
        --help|-h)
            echo "LeLink Full Stack Startup Script with Live Logs"
            echo ""
            echo "Usage: ./startup-live.sh [options]"
            echo ""
            echo "Options:"
            echo "  --skip-sc, --skip-smart-contract    Skip starting the smart contract"
            echo "  --skip-az, --skip-azure-functions   Skip starting Azure Functions"
            echo "  --skip-fe, --skip-frontend          Skip starting the frontend"
            echo "  --help, -h                          Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./startup-live.sh                   Start all services with live logs"
            echo "  ./startup-live.sh --skip-sc         Start Azure Functions and Frontend"
            echo "  ./startup-live.sh --skip-fe         Start only backend services"
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
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null || true
        fi
    done
    # Kill any remaining processes
    pkill -f "hardhat node" 2>/dev/null || true
    pkill -f "func start" 2>/dev/null || true
    pkill -f "tail -f" 2>/dev/null || true
    exit 0
}

# Set up trap for clean exit
trap cleanup SIGINT SIGTERM EXIT

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
    
    # Start Hardhat node
    print_status "Starting Hardhat node..."
    npm run node > ../../logs/hardhat-node.log 2>&1 &
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
        sed -i.bak "s/^LELINK_CONTRACT_ADDRESS=.*/LELINK_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" ../../.env
        rm ../../.env.bak
        
        # Export for current session
        export LELINK_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
    fi
    
    cd ../..
fi

# Start Azure Functions (if not skipped)
if [ "$SKIP_AZURE_FUNCTIONS" = false ]; then
    print_status "Starting Azure Functions services..."
    
    cd az/llmazfunc
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing Azure Functions dependencies..."
        npm install
    fi
    
    # Update or create local.settings.json from environment variables
    if [ ! -f "config/local.settings.json" ]; then
        if [ -f "config/local.settings.json.example" ]; then
            cp config/local.settings.json.example config/local.settings.json
        fi
    fi
    
    # Update local.settings.json with environment variables if they exist
    if [ -n "$OPENAI_API_KEY" ] && [ -n "$OPENAI_CONVERSATION_ASSISTANT_ID" ] && [ -n "$OPENAI_ORGANIZATION_ID" ]; then
        print_status "Updating local.settings.json with environment variables..."
        jq --arg key "$OPENAI_API_KEY" \
           --arg assistant "$OPENAI_CONVERSATION_ASSISTANT_ID" \
           --arg org "$OPENAI_ORGANIZATION_ID" \
           '.Values.OPENAI_API_KEY = $key | .Values.OPENAI_CONVERSATION_ASSISTANT_ID = $assistant | .Values.OPENAI_ORGANIZATION_ID = $org' \
           config/local.settings.json > config/local.settings.json.tmp && \
           mv config/local.settings.json.tmp config/local.settings.json
    fi
    
    # Start Azure Functions in development mode
    print_status "Starting Azure Functions in development mode..."
    npm run dev > ../../logs/azure-functions.log 2>&1 &
    AZURE_FUNC_PID=$!
    PIDS+=($AZURE_FUNC_PID)
    
    print_status "Waiting for Azure Functions to start..."
    sleep 20
    
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

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    export PORT=3001
else
    export PORT=3000
fi

# Start Next.js in development mode
print_status "Starting Next.js frontend on port $PORT..."
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)

print_status "Waiting for Frontend to start..."
sleep 10

cd ../..
fi

# Clear screen and display header
clear
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    LeLink Full Stack Services - Live Logs                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Services Started Successfully!${NC}"
echo ""
if [ "$SKIP_SMART_CONTRACT" = false ]; then
    echo -e "${YELLOW}Smart Contract:${NC}"
    echo "  • Hardhat Node: http://localhost:8545"
    echo "  • Contract: $CONTRACT_ADDRESS"
    echo ""
fi
if [ "$SKIP_AZURE_FUNCTIONS" = false ]; then
    echo -e "${YELLOW}Azure Functions:${NC}"
    echo "  • Endpoint: http://localhost:7071/api/symptomAssessmentBot"
    echo ""
fi
if [ "$SKIP_FRONTEND" = false ]; then
    echo -e "${YELLOW}Frontend:${NC}"
    echo "  • Web Interface: http://localhost:${PORT:-3000}"
    echo "  • PWA Enabled: Install as app from browser"
    echo ""
fi
if [ "$ENABLE_BLOCKCHAIN_LOGGING" = "true" ]; then
    echo -e "${GREEN}✅ Blockchain Integration: Enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Blockchain Integration: Disabled${NC}"
fi
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}To test:${NC} Open a new terminal and run ${GREEN}./run-testbot.sh${NC}"
echo -e "${MAGENTA}To stop:${NC} Press ${RED}Ctrl+C${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Live Logs:${NC}"
echo ""

# Function to colorize Hardhat logs
colorize_hardhat() {
    while IFS= read -r line; do
        if [[ "$line" == *"eth_"* ]] || [[ "$line" == *"Contract call"* ]]; then
            echo -e "${BLUE}[Hardhat]${NC} ${CYAN}$line${NC}"
        elif [[ "$line" == *"WARNING"* ]]; then
            echo -e "${BLUE}[Hardhat]${NC} ${YELLOW}$line${NC}"
        elif [[ "$line" == *"ERROR"* ]]; then
            echo -e "${BLUE}[Hardhat]${NC} ${RED}$line${NC}"
        else
            echo -e "${BLUE}[Hardhat]${NC} $line"
        fi
    done
}

# Function to colorize Azure Functions logs
colorize_azure() {
    while IFS= read -r line; do
        if [[ "$line" == *"🏥 === TRIAGE INTERACTION ==="* ]]; then
            echo -e "${GREEN}[Azure]${NC} ${CYAN}$line${NC}"
        elif [[ "$line" == *"🔗 === BLOCKCHAIN LOGGING ==="* ]]; then
            echo -e "${GREEN}[Azure]${NC} ${MAGENTA}$line${NC}"
        elif [[ "$line" == *"[Information]"* ]]; then
            echo -e "${GREEN}[Azure]${NC} ${GREEN}$line${NC}"
        elif [[ "$line" == *"[Warning]"* ]]; then
            echo -e "${GREEN}[Azure]${NC} ${YELLOW}$line${NC}"
        elif [[ "$line" == *"[Error]"* ]]; then
            echo -e "${GREEN}[Azure]${NC} ${RED}$line${NC}"
        elif [[ "$line" == *"Http Function"* ]]; then
            echo -e "${GREEN}[Azure]${NC} ${CYAN}$line${NC}"
        else
            echo -e "${GREEN}[Azure]${NC} $line"
        fi
    done
}

# Function to colorize Frontend logs
colorize_frontend() {
    while IFS= read -r line; do
        if [[ "$line" == *"ready"* ]] || [[ "$line" == *"started server"* ]]; then
            echo -e "${MAGENTA}[Frontend]${NC} ${GREEN}$line${NC}"
        elif [[ "$line" == *"compiled"* ]] || [[ "$line" == *"building"* ]]; then
            echo -e "${MAGENTA}[Frontend]${NC} ${CYAN}$line${NC}"
        elif [[ "$line" == *"warning"* ]] || [[ "$line" == *"warn"* ]]; then
            echo -e "${MAGENTA}[Frontend]${NC} ${YELLOW}$line${NC}"
        elif [[ "$line" == *"error"* ]] || [[ "$line" == *"Error"* ]]; then
            echo -e "${MAGENTA}[Frontend]${NC} ${RED}$line${NC}"
        elif [[ "$line" == *"[PWA]"* ]]; then
            echo -e "${MAGENTA}[Frontend]${NC} ${CYAN}$line${NC}"
        else
            echo -e "${MAGENTA}[Frontend]${NC} $line"
        fi
    done
}

# Tail all log files with color coding
if [ "$SKIP_SMART_CONTRACT" = false ]; then
    tail -f logs/hardhat-node.log 2>/dev/null | colorize_hardhat &
    TAIL_PID1=$!
    PIDS+=($TAIL_PID1)
fi

if [ "$SKIP_AZURE_FUNCTIONS" = false ]; then
    tail -f logs/azure-functions.log 2>/dev/null | colorize_azure &
    TAIL_PID2=$!
    PIDS+=($TAIL_PID2)
fi

if [ "$SKIP_FRONTEND" = false ]; then
    tail -f logs/frontend.log 2>/dev/null | colorize_frontend &
    TAIL_PID3=$!
    PIDS+=($TAIL_PID3)
fi

# Keep script running
wait