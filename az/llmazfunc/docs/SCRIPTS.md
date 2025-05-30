# Scripts Guide

This guide documents all the automation scripts available in the project.

## Test Scripts

Located in `scripts/test/`:

### test-all.sh

The primary test automation script that handles complete test environment setup and execution.

```bash
# Run all tests with automatic setup
./scripts/test/test-all.sh

# Run specific number of test scenarios
./scripts/test/test-all.sh 3
```

**What it does:**
1. Checks Node.js version and switches to v20 if needed
2. Starts Azurite (Azure Storage Emulator) if not running
3. Starts the Azure Functions runtime
4. Runs the test bot scenarios
5. Collects and reports results
6. Cleans up processes on exit

### runBotTest.js

JavaScript test runner that manages service orchestration. Called by `test-all.sh`.

## Start Scripts

Located in `scripts/start/`:

### start.sh

Basic startup script for Azure Functions:

```bash
./scripts/start/start.sh
```

### start-node20.sh

Ensures Node.js v20 is used before starting:

```bash
./scripts/start/start-node20.sh
```

**What it does:**
1. Kills any existing `func` processes
2. Switches to Node.js v20.18.1 using nvm
3. Starts Azure Functions with `func start`

## Usage Examples

### Complete Test Run

```bash
# Full automated test with all services
./scripts/test/test-all.sh
```

### Development Server

```bash
# Start development server with Node.js v20
./scripts/start/start-node20.sh
```

### Quick Test

```bash
# Run 2 test scenarios only
./scripts/test/test-all.sh 2
```

## Script Requirements

- **nvm**: For Node.js version management
- **Azure Functions Core Tools**: For running the functions runtime
- **npm**: For package management
- **Node.js v20**: Required for Azure Functions compatibility

## Troubleshooting Scripts

### Port Already in Use

If you see errors about port 7071 being in use:

```bash
# Kill existing processes
pkill -f "func start" || true
```

### Node Version Issues

If scripts fail due to Node.js version:

```bash
# Manually switch to Node.js v20
nvm use 20.18.1
```

### Permission Denied

Make scripts executable:

```bash
chmod +x scripts/test/*.sh
chmod +x scripts/start/*.sh
```

## Creating New Scripts

When adding new scripts:

1. Place in appropriate directory (`scripts/test/` or `scripts/start/`)
2. Make executable: `chmod +x script-name.sh`
3. Add documentation to this file
4. Update relevant guides (Testing, Getting Started, etc.)
5. Test on both macOS and Linux if possible