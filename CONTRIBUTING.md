# Contributing to LeLink

Thank you for your interest in contributing to LeLink! This guide will help you get started with contributing to this open-source healthcare data management system designed for **people in crisis situations**.

> **🇪🇺 EU Funded Project**: LeLink is proudly supported by the [NGI Sargasso](https://ngisargasso.eu/) programme, fostering transatlantic collaboration in Next Generation Internet technologies. This project has received funding from the European Union's Horizon Europe research and innovation programme.

> **🏛️ Organizations**: Developed by [Hora e.V.](https://hora-ev.eu) in collaboration with [Modern Miracle](https://modern-miracle.com) and [JurisCanada](https://www.linkedin.com/company/juriscanada/about/) (Legal & Compliance), focusing on innovative healthcare solutions for vulnerable populations.

## 🌟 **How to Contribute**

### **Ways to Contribute**
- 🐛 **Bug Reports** - Help us identify and fix issues
- 💡 **Feature Requests** - Suggest new functionality
- 📝 **Documentation** - Improve guides, examples, and explanations
- 🔧 **Code Contributions** - Fix bugs, implement features, optimize performance
- 🧪 **Testing** - Write tests, report test results, improve test coverage
- 🎨 **UI/UX Improvements** - Enhance user interface and experience
- 🔒 **Security** - Report vulnerabilities, improve security practices

## 🚀 **Getting Started**

### **1. Fork and Clone**
```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/LeLink.git
cd LeLink

# Add the original repository as upstream
git remote add upstream https://github.com/Modern-Miracle/LeLink.git
```

### **2. Set Up Development Environment**
```bash
# Run the setup wizard
./setup-wizard.sh

# Start all services
./startup.sh

# Verify everything works
./run-testbot.sh
```

### **3. Create a Feature Branch**
```bash
# Create a new branch for your feature/fix
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

## 📋 **Development Guidelines**

### **Code Style**
- **Frontend (Next.js/TypeScript)**: Follow the existing ESLint configuration
- **Backend (Node.js)**: Use ES6+ features, async/await patterns
- **Smart Contracts (Solidity)**: Follow Solidity best practices, comprehensive testing required
- **Documentation**: Use clear, concise language with examples

### **Commit Message Convention**
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(frontend): add patient search functionality
fix(backend): resolve OpenAI API timeout issue
docs(readme): update installation instructions
test(smart-contract): add edge case tests for record creation
```

### **Pull Request Process**

1. **Ensure your code follows our guidelines:**
   ```bash
   # Frontend linting
   cd fe/LL-next && npm run lint
   
   # Run all tests
   cd ../../ && ./startup.sh --test
   
   # Smart contract tests
   cd sc/LeLink-SC && npm test
   ```

2. **Update documentation** if your changes affect:
   - API endpoints
   - Environment variables
   - Setup procedures
   - User interface

3. **Write or update tests** for new functionality

4. **Create a descriptive pull request:**
   - Clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List breaking changes (if any)

## 🏗️ **Project Structure Guide**

### **Frontend (`/fe/LL-next/`)**
```
app/                 # Next.js 15 app directory
├── api/            # API routes
├── dashboard/      # Main application pages
├── login/          # Authentication pages
components/         # Reusable React components
├── ui/             # UI component library (shadcn/ui)
├── blockchain/     # Blockchain-related components
├── fhir/           # FHIR resource components
lib/                # Utilities and configurations
├── auth.ts         # Authentication configuration
├── fhir.ts         # FHIR utilities
├── types/          # TypeScript type definitions
```

### **Backend (`/az/llmazfunc/`)**
```
src/
├── functions/      # Azure Functions
├── assistants/     # OpenAI assistant integrations
├── services/       # Core business logic
│   ├── openai.js      # OpenAI API integration
│   ├── fhirStorage.js # FHIR storage layer
│   └── blockchain.js  # Blockchain logging
└── utils/          # Utility functions
tests/              # Integration tests
docs/               # Detailed documentation
```

### **Smart Contract (`/sc/LeLink-SC/`)**
```
contracts/          # Solidity smart contracts
scripts/            # Deployment scripts
test/               # Comprehensive test suite
react/              # React integration package
├── abi/            # Contract ABIs
├── hooks/          # React hooks
└── actions/        # Contract interactions
```

## 🧪 **Testing Guidelines**

### **Running Tests**
```bash
# All tests with coverage
./startup.sh --test

# Frontend tests
cd fe/LL-next && npm test

# Backend integration tests
cd az/llmazfunc && npm test

# Smart contract tests (81 tests)
cd sc/LeLink-SC && npm test

# Smart contract with coverage
cd sc/LeLink-SC && npm run test:coverage
```

### **Writing Tests**
- **Frontend**: Jest + React Testing Library
- **Backend**: Integration tests with real/mock services
- **Smart Contract**: Hardhat + Chai, aim for 100% coverage

### **Test Medical Scenarios**
```bash
# Run automated medical triage scenarios
./run-testbot.sh

# Specific scenario types
./run-testbot.sh -t chest-pain
./run-testbot.sh -t headache
./run-testbot.sh -s 5  # Run 5 random scenarios
```

## 🔒 **Security Considerations**

### **Reporting Security Issues**
- **DO NOT** open public issues for security vulnerabilities
- Email security issues to: [security@yourproject.com]
- Include detailed steps to reproduce
- Allow time for fix before public disclosure

### **Security Best Practices**
- Never commit real API keys or secrets
- Use environment variables for all sensitive data
- Follow OWASP guidelines for web application security
- Ensure FHIR data handling complies with healthcare regulations (HIPAA, GDPR)
- Test smart contracts thoroughly for common vulnerabilities
- **Crisis Context**: Prioritize data protection for vulnerable populations
- **Privacy-First**: Implement zero-knowledge patterns where possible

## 📚 **Documentation Standards**

### **Code Documentation**
- Use JSDoc for JavaScript/TypeScript functions
- Comment complex business logic
- Document API endpoints with examples
- Include inline comments for smart contract functions

### **User Documentation**
- Update README.md for new features
- Add examples to environment variable guides
- Create troubleshooting guides for common issues
- Document deployment procedures

## 🎯 **Good First Issues**

Looking for a place to start? Look for issues labeled:
- `good first issue` - Beginner-friendly
- `documentation` - Improve docs
- `frontend` - UI/UX improvements
- `testing` - Add test coverage
- `enhancement` - Feature improvements

## 🤝 **Community Guidelines**

### **Code of Conduct**
- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers get started
- Follow healthcare data privacy principles

### **Getting Help**
- Check existing issues and documentation first
- Use GitHub Discussions for questions
- Include relevant logs and system information
- Be specific about your environment and steps taken

## 📊 **Performance Guidelines**

### **Frontend Performance**
- Use React.memo() for expensive components
- Implement proper loading states
- Optimize image sizes and formats
- Test offline functionality

### **Backend Performance**
- Monitor Azure Functions cold start times
- Implement proper error handling and retries
- Cache expensive operations when appropriate
- Monitor OpenAI API usage and costs

### **Smart Contract Optimization**
- Minimize gas usage in contract functions
- Use events for logging instead of storage when possible
- Test gas costs with different data sizes
- Consider batch operations for multiple records

## 🚢 **Release Process**

### **Versioning**
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### **Release Checklist**
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Migration guide (if needed)
- [ ] Changelog updated

## 📞 **Contact**

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and community discussion
- **Organizations**: 
  - **Hora e.V.**: [contact@hora-ev.eu](mailto:contact@hora-ev.eu)
  - **Modern Miracle**: [contact@modern-miracle.com](mailto:contact@modern-miracle.com)
  - **JurisCanada** (Legal & Compliance): [LinkedIn](https://www.linkedin.com/company/juriscanada/about/)
- **NGI Sargasso**: Contact via [NGI Sargasso](https://ngisargasso.eu/contact/) for programme-related inquiries

Thank you for contributing to LeLink! Together, we can build better healthcare technology. 🏥✨