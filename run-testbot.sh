#!/bin/bash

# LeLink Test Bot Runner
# This script runs the medical triage test bot to demonstrate the blockchain integration

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[Test Bot]${NC} $1"
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

# Check if services are running
check_services() {
    # Check if Azure Functions is running
    if ! curl -s http://localhost:7071 > /dev/null 2>&1; then
        print_error "Azure Functions not running on port 7071"
        print_info "Please run ./startup.sh first to start the services"
        exit 1
    fi
    
    # Check if Hardhat is running
    if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
        print_warning "Hardhat node not running on port 8545"
        print_info "Blockchain logging may not work"
    fi
}

# Display header
clear
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           LeLink Medical Triage Test Bot                       ║${NC}"
echo -e "${CYAN}║                                                                ║${NC}"
echo -e "${CYAN}║  This will run test scenarios to demonstrate:                 ║${NC}"
echo -e "${CYAN}║  • Medical triage conversations                                ║${NC}"
echo -e "${CYAN}║  • FHIR resource generation                                    ║${NC}"
echo -e "${CYAN}║  • Blockchain logging of healthcare data                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if services are running
print_status "Checking if services are running..."
check_services
print_status "Services detected ✓"
echo ""

# Parse command line arguments
NUM_SCENARIOS=""
NO_EXPORT=""
SCENARIO_TYPE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --scenarios|-s)
            NUM_SCENARIOS="$2"
            shift 2
            ;;
        --no-export)
            NO_EXPORT="--no-export"
            shift
            ;;
        --type|-t)
            SCENARIO_TYPE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./run-testbot.sh [options]"
            echo ""
            echo "Options:"
            echo "  -s, --scenarios <number>   Number of test scenarios to run"
            echo "  -t, --type <type>         Scenario type: chest-pain, headache, abdominal-pain, minor-cut"
            echo "  --no-export               Skip exporting FHIR resources to files"
            echo "  -h, --help                Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-testbot.sh                    # Run all scenarios"
            echo "  ./run-testbot.sh -s 5               # Run 5 random scenarios"
            echo "  ./run-testbot.sh -t chest-pain      # Run chest pain scenario"
            echo "  ./run-testbot.sh --no-export        # Run without saving resources"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Change to Azure Functions directory
cd az/llmazfunc

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" != "20" ]; then
    print_warning "Current Node.js version: $(node -v)"
    
    # Try to switch to Node 20 if nvm is available
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
        nvm use 20 2>/dev/null || nvm use 20.* 2>/dev/null
        print_status "Switched to Node.js $(node -v)"
    else
        print_info "Azure Functions works best with Node.js v20"
    fi
fi

# Display test configuration
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test Configuration:${NC}"
echo -e "  • Endpoint: http://localhost:7071/api/symptomAssessmentBot"
if [ -n "$NUM_SCENARIOS" ]; then
    echo -e "  • Scenarios: $NUM_SCENARIOS"
else
    echo -e "  • Scenarios: All available"
fi
if [ -n "$SCENARIO_TYPE" ]; then
    echo -e "  • Type: $SCENARIO_TYPE"
fi
if [ -n "$NO_EXPORT" ]; then
    echo -e "  • Export: Disabled"
else
    echo -e "  • Export: Enabled (to tests/integration/lekink-test-results/)"
fi

# Check blockchain status
if [ -f "../../.env" ]; then
    source ../../.env
    if [ "$ENABLE_BLOCKCHAIN_LOGGING" = "true" ]; then
        echo -e "  • Blockchain: ${GREEN}Enabled${NC} (Network: $BLOCKCHAIN_NETWORK)"
        echo -e "  • Contract: ${CONTRACT_ADDRESS:-Not set}"
    else
        echo -e "  • Blockchain: ${YELLOW}Disabled${NC}"
    fi
fi

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Ask for confirmation
read -p "Ready to start test scenarios? (Y/n): " confirm
confirm="${confirm:-Y}"

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    print_info "Test cancelled"
    exit 0
fi

echo ""
print_status "Starting test bot..."
echo -e "${CYAN}Watch for triage interactions and blockchain logging below:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Build command
CMD="node scripts/test/runBotTest.js"
if [ -n "$NUM_SCENARIOS" ]; then
    CMD="$CMD $NUM_SCENARIOS"
fi
if [ -n "$SCENARIO_TYPE" ]; then
    CMD="$CMD --type $SCENARIO_TYPE"
fi
if [ -n "$NO_EXPORT" ]; then
    CMD="$CMD $NO_EXPORT"
fi

# Run the test bot
$CMD

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print_status "Test completed!"

# Show results location if export was enabled
if [ -z "$NO_EXPORT" ]; then
    echo ""
    print_info "FHIR resources exported to:"
    echo "  az/llmazfunc/tests/integration/lekink-test-results/"
    echo ""
    print_info "To view the latest results:"
    echo "  cd az/llmazfunc/tests/integration/lekink-test-results"
    echo "  ls -la"
fi