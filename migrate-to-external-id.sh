#!/bin/bash

# LeLink Migration to Microsoft Entra External ID
# This script helps migrate from Azure AD to Entra External ID

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
    echo -e "${GREEN}[Migration]${NC} $1"
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

print_header() {
    echo -e "${CYAN}$1${NC}"
}

# Check if we're in the right directory
if [ ! -d "fe/LL-next" ]; then
    print_error "Please run this script from the lelink-full-app root directory"
    exit 1
fi

clear
print_header "════════════════════════════════════════════════════════════════"
print_header "       LeLink Migration to Microsoft Entra External ID"
print_header "════════════════════════════════════════════════════════════════"
echo ""

print_status "This script will help you migrate from Azure AD to Entra External ID"
echo ""

# Parse command line arguments
SKIP_BACKUP=false
AUTO_SWITCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --auto-switch)
            AUTO_SWITCH=true
            shift
            ;;
        --help|-h)
            echo "LeLink Migration to Entra External ID"
            echo ""
            echo "Usage: ./migrate-to-external-id.sh [options]"
            echo ""
            echo "Options:"
            echo "  --skip-backup    Skip backing up current configuration"
            echo "  --auto-switch    Automatically switch to External ID config"
            echo "  --help, -h       Show this help message"
            echo ""
            echo "Steps:"
            echo "1. Backup current Azure AD configuration"
            echo "2. Set up External ID configuration files"
            echo "3. Guide you through External ID tenant setup"
            echo "4. Test the new configuration"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd fe/LL-next

# Step 1: Backup current configuration
if [ "$SKIP_BACKUP" = false ]; then
    print_status "Step 1: Backing up current Azure AD configuration..."
    
    if [ -f "lib/config/authConfig.ts" ]; then
        cp lib/config/authConfig.ts lib/config/authConfig.azure.backup.ts
        print_info "✓ Backed up authConfig.ts to authConfig.azure.backup.ts"
    fi
    
    if [ -f ".env.local" ]; then
        cp .env.local .env.azure.backup
        print_info "✓ Backed up .env.local to .env.azure.backup"
    fi
    
    echo ""
else
    print_warning "Skipping backup as requested"
    echo ""
fi

# Step 2: Set up External ID configuration
print_status "Step 2: Setting up External ID configuration files..."

if [ ! -f "lib/config/authConfig.external.ts" ]; then
    print_error "External ID config file not found. Please ensure authConfig.external.ts exists."
    exit 1
fi

if [ ! -f ".env.external.example" ]; then
    print_error "External ID environment template not found. Please ensure .env.external.example exists."
    exit 1
fi

print_info "✓ External ID configuration files are ready"
echo ""

# Step 3: Guide through External ID setup
print_status "Step 3: External ID Tenant Setup Guide"
echo ""
print_header "Follow these steps to set up your External ID tenant:"
echo ""

echo "🌐 1. Create External ID Tenant:"
echo "   • Go to https://portal.azure.com"
echo "   • Search for 'Microsoft Entra External ID'"
echo "   • Click 'Create' → 'External tenant'"
echo "   • Choose a tenant name (e.g., lelinkhealth)"
echo "   • Select your region"
echo ""

echo "📱 2. Register Your Application:"
echo "   • In your External ID tenant, go to 'App registrations'"
echo "   • Click 'New registration'"
echo "   • Name: 'LeLink Healthcare App'"
echo "   • Supported account types: 'Accounts in this organizational directory only'"
echo "   • Redirect URI: 'Web' → 'http://localhost:3000/api/auth/callback/microsoft-entra-id'"
echo "   • Click 'Register'"
echo ""

echo "🔑 3. Configure Application:"
echo "   • Go to 'Certificates & secrets'"
echo "   • Click 'New client secret'"
echo "   • Description: 'LeLink App Secret'"
echo "   • Expires: '24 months'"
echo "   • Copy the secret value immediately!"
echo ""

echo "🔄 4. Set User Flows:"
echo "   • Go to 'User flows' in External ID"
echo "   • Create a 'Sign up and sign in' flow"
echo "   • Configure attributes: Email, Display Name, Given Name, Surname"
echo "   • Test the flow"
echo ""

echo "⚙️  5. Configure Environment Variables:"
echo "   • Copy .env.external.example to .env.local"
echo "   • Fill in your External ID tenant details"
echo ""

# Ask if user wants to continue
read -p "Have you completed the External ID tenant setup? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please complete the External ID setup first, then run this script again."
    exit 0
fi

# Step 4: Environment setup
print_status "Step 4: Setting up environment configuration..."

if [ ! -f ".env.local" ]; then
    if [ "$AUTO_SWITCH" = true ]; then
        cp .env.external.example .env.local
        print_info "✓ Created .env.local from External ID template"
        print_warning "Please edit .env.local with your External ID tenant details"
    else
        echo ""
        read -p "Create .env.local from External ID template? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp .env.external.example .env.local
            print_info "✓ Created .env.local from External ID template"
            print_warning "Please edit .env.local with your External ID tenant details"
        fi
    fi
else
    print_warning ".env.local already exists. Please manually merge External ID variables."
fi

echo ""

# Step 5: Switch authentication configuration
print_status "Step 5: Switching authentication configuration..."

if [ "$AUTO_SWITCH" = true ]; then
    cp lib/config/authConfig.external.ts lib/config/authConfig.ts
    print_info "✓ Switched to External ID authentication configuration"
else
    echo ""
    read -p "Switch to External ID authentication configuration now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp lib/config/authConfig.external.ts lib/config/authConfig.ts
        print_info "✓ Switched to External ID authentication configuration"
    else
        print_warning "You can manually switch later by copying authConfig.external.ts to authConfig.ts"
    fi
fi

echo ""

# Step 6: Next steps
print_status "Step 6: Next Steps"
echo ""
print_header "Configuration Complete! Next steps:"
echo ""

echo "1. 📝 Edit .env.local with your External ID details:"
echo "   • ENTRA_EXTERNAL_TENANT_ID"
echo "   • ENTRA_EXTERNAL_TENANT_NAME" 
echo "   • ENTRA_EXTERNAL_CLIENT_ID"
echo "   • ENTRA_EXTERNAL_CLIENT_SECRET"
echo ""

echo "2. 🚀 Test your configuration:"
echo "   • Run: cd ../.. && ./startup.sh"
echo "   • Open: http://localhost:3000"
echo "   • Test sign-in flow"
echo ""

echo "3. 🔄 Rollback if needed:"
echo "   • Restore: cp lib/config/authConfig.azure.backup.ts lib/config/authConfig.ts"
echo "   • Restore: cp .env.azure.backup .env.local"
echo ""

echo "4. 🏥 Update application redirect URIs for production:"
echo "   • Add your production domain to External ID app registration"
echo "   • Update NEXTAUTH_URL in production environment"
echo ""

print_header "════════════════════════════════════════════════════════════════"
print_status "Migration setup complete! Happy authenticating! 🎉"
print_header "════════════════════════════════════════════════════════════════"