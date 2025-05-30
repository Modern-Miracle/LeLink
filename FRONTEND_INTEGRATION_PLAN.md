# Frontend Integration Plan

This document outlines the step-by-step plan to integrate the Next.js frontend with the Azure Functions backend and LeLink smart contract.

## Overview

The frontend currently operates standalone without leveraging the backend's medical triage assistant or blockchain audit capabilities. This plan addresses all integration gaps systematically.

## Phase 1: Backend API Integration (Priority: High)

### 1.1 Environment Configuration
- [ ] Create `.env.example` file with all required variables
- [ ] Add backend service URLs and credentials
- [ ] Configure CORS settings for local development

**Required Environment Variables:**
```bash
# Backend Services
AZURE_FUNCTIONS_URL=http://localhost:7071
AZURE_FUNCTIONS_API_KEY=<optional-for-local>

# Blockchain
BLOCKCHAIN_RPC_URL=http://localhost:8545
LELINK_CONTRACT_ADDRESS=<from-deployment>

# FHIR Storage
ENABLE_FHIR_STORAGE=true
FHIR_SERVER_URL=<from-backend-config>

# Existing Azure AD (keep these)
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=
AUTH_SECRET=
```

### 1.2 Triage API Integration
- [ ] Update `/app/api/triage/submit/route.ts` to call Azure Functions
- [ ] Remove local AI SDK calls, use backend endpoint
- [ ] Implement proper error handling and response streaming
- [ ] Add thread management for conversation continuity

**Implementation:**
```typescript
// app/api/triage/submit/route.ts
const BACKEND_URL = process.env.AZURE_FUNCTIONS_URL + '/api/symptomAssessmentBot';

export async function POST(request: Request) {
  const { message, threadId, patientId } = await request.json();
  
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.AZURE_FUNCTIONS_API_KEY || ''
    },
    body: JSON.stringify({
      message,
      threadId,
      patientId,
      includeResources: true
    })
  });
  
  // Handle streaming response from backend
  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### 1.3 Update Triage UI
- [ ] Modify `/app/dashboard/triage/page.tsx` to use backend API
- [ ] Add loading states for backend communication
- [ ] Display FHIR resources returned from backend
- [ ] Implement error boundaries

## Phase 2: FHIR Resource Integration (Priority: High)

### 2.1 Extend Type Definitions
- [ ] Add missing FHIR resource types to `/lib/types/fhir.ts`
- [ ] Include Observation, RiskAssessment, Condition types
- [ ] Align with backend FHIR R4 specification

**Required Types:**
```typescript
// lib/types/fhir.ts
export interface Observation {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'preliminary' | 'registered' | 'cancelled';
  code: CodeableConcept;
  subject: Reference;
  effectiveDateTime?: string;
  valueString?: string;
  valueQuantity?: Quantity;
  interpretation?: CodeableConcept[];
}

export interface RiskAssessment {
  resourceType: 'RiskAssessment';
  id: string;
  status: 'final' | 'amended' | 'corrected' | 'cancelled';
  subject: Reference;
  prediction?: Array<{
    outcome?: CodeableConcept;
    probability?: number;
    qualitativeRisk?: CodeableConcept;
  }>;
}
```

### 2.2 Create FHIR Display Components
- [ ] Build `components/fhir/ObservationCard.tsx`
- [ ] Build `components/fhir/RiskAssessmentCard.tsx`
- [ ] Build `components/fhir/ResourceList.tsx`
- [ ] Add to triage results display

### 2.3 FHIR Storage Integration
- [ ] Create service for fetching FHIR resources
- [ ] Add patient history retrieval
- [ ] Implement resource caching strategy

## Phase 3: Smart Contract Integration (Priority: Medium)

### 3.1 Setup Blockchain Connection
- [ ] Install ethers.js or viem
- [ ] Import contract ABI from `sc/LeLink-SC/react/abi/lelink.abi.ts`
- [ ] Create blockchain service module

**Implementation:**
```typescript
// lib/services/blockchain.ts
import { ethers } from 'ethers';
import { LELINK_ABI } from '@/../../sc/LeLink-SC/react/abi/lelink.abi';

export class BlockchainService {
  private contract: ethers.Contract;
  
  constructor() {
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    this.contract = new ethers.Contract(
      process.env.LELINK_CONTRACT_ADDRESS!,
      LELINK_ABI,
      provider
    );
  }
  
  async getAuditLogs(patientId: string) {
    // Implement audit log retrieval
  }
}
```

### 3.2 Integrate Audit Logging
- [ ] Add blockchain hash display to patient records
- [ ] Show audit trail in admin panel
- [ ] Implement verification UI for data integrity
- [ ] Add transaction status indicators

### 3.3 Admin Blockchain Features
- [ ] Connect admin blockchain settings to actual contract
- [ ] Add contract pause/unpause functionality
- [ ] Display contract statistics
- [ ] Show gas usage metrics

## Phase 4: Authentication Alignment (Priority: High)

### 4.1 Unified Authentication Strategy
- [ ] Create shared auth service for backend calls
- [ ] Add API key management for backend
- [ ] Implement token refresh logic
- [ ] Handle auth errors gracefully

### 4.2 Backend Authentication
- [ ] Add auth headers to all backend API calls
- [ ] Implement user context passing
- [ ] Handle Azure AD tokens for FHIR access

## Phase 5: Testing & Error Handling (Priority: Medium)

### 5.1 Integration Tests
- [ ] Create test suite for backend API calls
- [ ] Mock Azure Functions responses
- [ ] Test FHIR resource handling
- [ ] Test blockchain integration

### 5.2 Error Handling
- [ ] Add comprehensive error boundaries
- [ ] Implement retry logic for failed requests
- [ ] Create user-friendly error messages
- [ ] Add logging service

### 5.3 Performance Optimization
- [ ] Implement request caching
- [ ] Add loading skeletons
- [ ] Optimize bundle size
- [ ] Enable progressive enhancement

## Phase 6: Production Readiness (Priority: Low)

### 6.1 Configuration
- [ ] Create production environment files
- [ ] Setup Azure deployment configuration
- [ ] Configure production CORS
- [ ] Enable production logging

### 6.2 Security
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Enable CSP headers
- [ ] Audit dependencies

### 6.3 Documentation
- [ ] Update README with integration details
- [ ] Create API documentation
- [ ] Add deployment guide
- [ ] Document troubleshooting steps

## Execution Timeline

### Week 1: Core Integration
- Days 1-2: Environment setup & backend API integration (Phase 1)
- Days 3-4: FHIR resource support (Phase 2)
- Day 5: Authentication alignment (Phase 4)

### Week 2: Advanced Features
- Days 1-2: Smart contract integration (Phase 3)
- Days 3-4: Testing setup (Phase 5.1)
- Day 5: Error handling (Phase 5.2)

### Week 3: Polish & Deploy
- Days 1-2: Performance optimization (Phase 5.3)
- Days 3-4: Production configuration (Phase 6)
- Day 5: Final testing & documentation

## Success Metrics

- [ ] Triage chat successfully calls Azure Functions backend
- [ ] FHIR resources are created and displayed properly
- [ ] Blockchain audit trail is visible in UI
- [ ] All integration tests pass
- [ ] No TypeScript/ESLint errors
- [ ] Production deployment successful

## Next Steps

1. Start with Phase 1.1 - Create environment configuration
2. Test backend connectivity locally
3. Implement one integration at a time
4. Test thoroughly before moving to next phase

This plan ensures systematic integration while maintaining code quality and user experience.