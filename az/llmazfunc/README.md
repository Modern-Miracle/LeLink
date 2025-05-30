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
```

## 📄 **License**

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

This ensures that any modifications or network-based services using this code must also be open source. See the [LICENSE](../../LICENSE) file for complete details.
