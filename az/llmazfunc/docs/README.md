# LeLink Triage Assistant Documentation

Welcome to the LeLink Triage Assistant project! This documentation provides everything you need to understand, run, and maintain this medical triage bot.

## 📚 Documentation Overview

- **[Architecture Overview](ARCHITECTURE.md)** - System design and component relationships
- **[Getting Started](GETTING_STARTED.md)** - Quick setup and installation guide
- **[API Reference](API.md)** - Detailed API endpoints and request/response formats
- **[Testing Guide](TESTING.md)** - How to run and write tests
- **[Scripts Guide](SCRIPTS.md)** - Automation scripts documentation
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Development Guide](DEVELOPMENT.md)** - Best practices and coding standards
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd leveaBotHttpv4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp config/local.settings.json.example config/local.settings.json
   # Edit config/local.settings.json with your OpenAI credentials
   ```

4. **Start the application**
   ```bash
   npm start
   # or for Node.js v20 specifically:
   npm run start:node20
   ```

5. **Run tests**
   ```bash
   # Automated test script (recommended)
   ./scripts/test/test-all.sh
   
   # Or manual testing
   npm test
   ```

## 🏗️ Project Structure

```
leveaBotHttpv4/
├── src/                    # Source code
│   ├── functions/         # Azure Functions entry points
│   ├── assistants/        # Bot assistant logic
│   ├── services/          # External service integrations
│   └── utils/            # Utility functions
├── tests/                 # Test suites
├── scripts/              # Build and deployment scripts
├── docs/                 # Documentation
├── config/               # Configuration files
└── package.json          # Project dependencies
```

## 🛠️ Technology Stack

- **Runtime**: Node.js v20 (required for Azure Functions)
- **Framework**: Azure Functions v4
- **AI**: OpenAI Assistant API
- **Language**: JavaScript/Node.js
- **Testing**: Custom test framework with axios

## 👥 Team

- **Project Lead**: [Name]
- **Lead Developer**: [Name]
- **Contact**: [Email/Slack]

## 📝 License

[Your license here]

---

For more detailed information, please refer to the specific documentation guides listed above.