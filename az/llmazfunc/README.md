# LeLink Triage Assistant

An Azure Functions-based medical triage assistant using OpenAI.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure settings:
   ```bash
   cp config/local.settings.json.example config/local.settings.json
   # Edit config/local.settings.json with your OpenAI credentials
   ```

3. Start the application:
   ```bash
   ./scripts/start/start.sh
   ```

4. Run tests:
   ```bash
   cd tests && npm test
   ```

## Documentation

- [Complete Documentation](docs/README.md)
- [API Documentation](docs/API.md)
- [Testing Guide](docs/TESTING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Structure

```
├── src/          # Source code
├── tests/        # Test files
├── scripts/      # Utility scripts
├── docs/         # Documentation
└── config/       # Configuration files
```# llmazfunc
