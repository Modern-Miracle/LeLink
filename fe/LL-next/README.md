# LeLink Frontend - Crisis Healthcare PWA

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![NGI Sargasso](https://img.shields.io/badge/NGI-Sargasso-blue.svg)](https://ngisargasso.eu/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)

A privacy-preserving progressive web application built with Next.js 15, specifically designed for **crisis healthcare situations**. Provides immediate access to AI-powered medical triage, FHIR-compliant data management, and blockchain audit trails for vulnerable populations.

> **🇪🇺 EU Funded Project**: This project is supported by the [NGI Sargasso](https://ngisargasso.eu/) programme under the European Union's Horizon Europe research and innovation programme, fostering transatlantic collaboration in Next Generation Internet technologies.

> **🏛️ Organizations**: Developed by [Hora e.V.](https://hora-ev.eu) in collaboration with [Modern Miracle](https://modern-miracle.com).

## 🌟 **Crisis-Focused Features**

- 🆘 **Crisis Triage Interface** - Immediate AI-powered medical assessment for emergency situations
- 👥 **Vulnerable Population Support** - Specialized patient management for crisis contexts
- 📊 **Real-Time Dashboard** - Critical health metrics and system status monitoring
- 🔗 **Transparency Through Blockchain** - Immutable audit trails building trust with patients
- 📱 **Offline-First PWA** - Works without internet connection, crucial for crisis areas
- 🔒 **Privacy-First Authentication** - Secure access protecting sensitive crisis data
- 🎨 **Accessible UI** - WCAG compliant design for users with disabilities
- 🌍 **Multi-Language Ready** - Internationalization support for global crisis response
- 📶 **Low-Bandwidth Optimized** - Efficient data usage for areas with poor connectivity

## 🛠️ **Technology Stack**

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: NextAuth.js with Azure AD/Entra ID
- **State Management**: React hooks + Context API
- **PWA**: next-pwa for offline functionality
- **Blockchain**: ethers.js for Web3 integration
- **FHIR**: Custom FHIR R4 resource components

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Azure AD application (for authentication)

### **Installation**

1. **Navigate to frontend directory:**
   ```bash
   cd fe/LL-next
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access application:**
   - Development: http://localhost:3000
   - Production build: `npm run build && npm start`

## 📁 **Project Structure**

```
fe/LL-next/
├── app/                          # Next.js 15 App Router
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── patients/           # Patient management API
│   │   ├── triage/             # Medical triage API
│   │   └── records/            # Medical records API
│   ├── dashboard/              # Main application pages
│   │   ├── appointments/       # Appointment management
│   │   ├── patients/           # Patient listing and details
│   │   ├── records/            # Medical records view
│   │   └── triage/             # Medical triage interface
│   ├── login/                  # Authentication pages
│   ├── admin/                  # Administrative interface
│   └── doctors/                # Doctor-specific views
├── components/                  # Reusable React components
│   ├── ui/                     # shadcn/ui component library
│   ├── blockchain/             # Blockchain-related components
│   │   ├── AuditTrail.tsx     # Audit trail visualization
│   │   ├── BlockchainHash.tsx # Hash display component
│   │   └── BlockchainStatus.tsx # Connection status
│   ├── fhir/                   # FHIR resource components
│   │   ├── ObservationCard.tsx # FHIR Observation display
│   │   ├── RiskAssessmentCard.tsx # Risk assessment display
│   │   └── ResourceList.tsx    # Generic FHIR resource list
│   ├── dashboard-header.tsx    # Main navigation header
│   ├── triage-modal.tsx        # Medical triage modal
│   └── patient-details.tsx     # Patient information display
├── lib/                        # Utilities and configurations
│   ├── auth.ts                 # NextAuth.js configuration
│   ├── fhir.ts                 # FHIR utilities and types
│   ├── services/               # Service layer
│   │   ├── blockchain.ts       # Blockchain integration
│   │   └── fhir.ts            # FHIR service calls
│   └── types/                  # TypeScript type definitions
├── hooks/                      # Custom React hooks
│   ├── use-mobile.tsx          # Mobile device detection
│   ├── use-offline.tsx         # Offline status tracking
│   └── use-toast.ts            # Toast notification system
├── public/                     # Static assets
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # App icons
├── styles/                     # Global styles
└── middleware.ts               # Next.js middleware for auth
```

## 🎨 **Design System**

### **UI Components**
Built with [shadcn/ui](https://ui.shadcn.com/) providing:
- Consistent design language
- Accessibility-first components
- Dark/light theme support
- Responsive design patterns

### **Key Components**
- **Dashboard Header** - Navigation and user menu
- **Triage Modal** - Interactive medical assessment
- **Patient Cards** - Patient information display
- **Blockchain Status** - Real-time connection indicator
- **FHIR Resource Cards** - Medical data visualization

## 🔐 **Authentication**

### **Supported Providers**
- **Azure AD/Entra ID** - Primary enterprise authentication
- **Azure AD B2C** - Consumer identity management
- **Google OAuth** - Alternative social login

### **Configuration**
```typescript
// lib/auth.ts
export const authConfig = {
  providers: [
    EntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
    }),
    // Additional providers...
  ],
  // Custom callbacks and session handling
}
```

## 📱 **Progressive Web App**

### **Crisis-Ready PWA Features**
- **Offline-First Architecture** - Full functionality without internet connectivity
- **Emergency Installation** - Quick add to home screen for immediate access
- **Background Sync** - Queue critical medical data when connectivity is restored
- **Crisis Notifications** - Urgent medical alerts and emergency updates
- **Data Persistence** - Local storage of essential patient information
- **Bandwidth Optimization** - Minimal data usage for poor network conditions

### **Installation**
Users can install the app directly from their browser:
1. Chrome: Menu → "Install LeLink Healthcare"
2. Safari: Share → "Add to Home Screen"
3. Edge: Settings → "Apps" → "Install this site as an app"

## 🏥 **Medical Triage Interface**

### **Features**
- **AI-Powered Assessment** - Integration with OpenAI medical assistant
- **Real-time Conversation** - Dynamic chat interface
- **FHIR Resource Generation** - Automatic medical record creation
- **Risk Assessment** - Color-coded severity indicators
- **Blockchain Logging** - Transparent audit trail

### **Usage Flow**
1. Patient initiates triage session
2. AI assistant asks relevant medical questions
3. System generates FHIR-compliant observations
4. Risk assessment created and displayed
5. All interactions logged to blockchain

## 🔗 **Blockchain Integration**

### **Components**
- **AuditTrail.tsx** - Complete transaction history
- **BlockchainHash.tsx** - Individual hash verification
- **BlockchainStatus.tsx** - Network connection status

### **Features**
- Real-time transaction monitoring
- Hash verification for data integrity
- Network status indicators
- Gas fee tracking

## 📊 **API Integration**

### **Backend Services**
- **Azure Functions** - Medical triage and FHIR processing
- **FHIR Server** - Healthcare data storage
- **Blockchain Network** - Audit trail logging

### **API Routes**
```typescript
// app/api/triage/submit/route.ts
export async function POST(request: Request) {
  // Proxy to Azure Functions backend
  // Handle authentication and validation
  // Return structured response
}
```

## 🧪 **Testing**

### **Test Setup**
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### **Testing Tools**
- **Jest** - Unit testing framework
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing
- **MSW** - API mocking for tests

## 📦 **Build and Deployment**

### **Development**
```bash
npm run dev          # Development server
npm run lint         # ESLint checking
npm run type-check   # TypeScript validation
```

### **Production**
```bash
npm run build        # Production build
npm start            # Start production server
npm run analyze      # Bundle analysis
```

### **Docker Deployment**
```bash
# Build Docker image
docker build -t lelink-frontend .

# Run container
docker run -p 3000:3000 lelink-frontend
```

## 🔧 **Configuration**

### **Environment Variables**
See `.env.example` for all configuration options:

- **Authentication**: Azure AD credentials, NextAuth secrets
- **Backend Services**: API endpoints, authentication keys
- **Blockchain**: RPC URLs, contract addresses
- **Features**: Enable/disable specific functionality

### **Build Configuration**
```javascript
// next.config.mjs
const config = {
  experimental: {
    appDir: true,
  },
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
  // Additional optimizations
}
```

## 🎯 **Performance Optimization**

### **Implemented Optimizations**
- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js Image component
- **Bundle Analysis** - Webpack bundle analyzer
- **Caching** - Aggressive caching strategies
- **Lazy Loading** - Component-level lazy loading

### **Performance Monitoring**
- Web Vitals tracking
- Application Insights integration
- Real User Monitoring (RUM)
- Error boundary implementation

## 🤝 **Contributing**

### **Development Workflow**
1. Fork and clone the repository
2. Create feature branch
3. Implement changes with tests
4. Run linting and type checking
5. Submit pull request

### **Code Standards**
- TypeScript strict mode
- ESLint + Prettier formatting
- Component documentation
- Accessibility compliance

## 📚 **Additional Resources**

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [NextAuth.js Guide](https://next-auth.js.org/)
- [FHIR R4 Specification](https://hl7.org/fhir/R4/)

## 🐛 **Troubleshooting**

### **Common Issues**
- **Authentication Failed**: Check Azure AD configuration
- **API Connection Error**: Verify backend service URLs
- **PWA Not Installing**: Check manifest.json and HTTPS
- **Blockchain Connection**: Verify RPC URL and contract address

### **Debug Mode**
Enable detailed logging:
```bash
DEBUG=1 npm run dev
```

## 📄 **License**

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

This ensures that any modifications or network-based services using this code must also be open source. See the [LICENSE](../../LICENSE) file for complete details.

## 🏛️ **Organizations**

**Developed by:**
- **[Hora e.V.](https://hora-ev.eu)** - German non-profit focused on social innovation
- **[Modern Miracle](https://modern-miracle.com)** - Healthcare technology specialists

**Contact:**
- Hora e.V.: [contact@hora-ev.eu](mailto:contact@hora-ev.eu)
- Modern Miracle: [contact@modern-miracle.com](mailto:contact@modern-miracle.com)

---

**Built with ❤️ for healthcare innovation** 🏥✨