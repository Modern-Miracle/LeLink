# LeLink Integration Guide

A comprehensive guide for integrating LeLink smart contract functionality into your applications.

## LeLink Integrated System

LeLink is now fully integrated with the Azure Functions medical triage bot:

1. **Medical Triage Bot** generates FHIR resources (RiskAssessment, Observation)
2. **FHIR Storage** saves resources to Azurite (dev) or Azure FHIR Service (prod)
3. **Blockchain Logging** automatically hashes and logs resources to LeLink smart contract
4. **Audit Trail** provides immutable record of all healthcare data operations

### Quick Start with Integrated System

```bash
# Start the complete integrated system
./setup-wizard.sh     # Configure environment
./startup.sh          # Start all services
./run-testbot.sh      # Test medical scenarios
```

## Table of Contents

- [Integrated System Architecture](#integrated-system-architecture)
- [Next.js Integration](#nextjs-integration)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Provider Setup](#provider-setup)
- [Basic Usage](#basic-usage)
- [Advanced Patterns](#advanced-patterns)
- [Type Safety](#type-safety)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Integrated System Architecture

The LeLink ecosystem consists of:

```
Azure Functions (Medical Triage Bot)
         │
         ├─→ FHIR Storage (Azurite/FHIR Service)
         │
         └─→ LeLink Smart Contract (Blockchain)
                    │
                    └─→ Immutable Audit Trail
```

### Data Flow Example

```javascript
// 1. Patient sends symptoms to triage bot
POST /api/symptomAssessmentBot
{
  "message": "I have chest pain",
  "patientId": "patient-123"
}

// 2. Bot generates FHIR resources
{
  "resources": {
    "RiskAssessment": { /* FHIR compliant */ },
    "Observation": { /* FHIR compliant */ }
  }
}

// 3. Resources automatically stored and logged
{
  "fhirStorage": {
    "mode": "azurite",
    "results": [/* storage confirmations */]
  },
  "blockchain": {
    "network": "localhost",
    "results": [/* transaction hashes */]
  }
}
```

## Next.js Integration

## Prerequisites

Before integrating LeLink into your Next.js application, ensure you have:

- **Node.js**: Version 18.0.0 or higher
- **Next.js**: Version 13.0.0 or higher (App Router recommended)
- **TypeScript**: Version 5.0.0 or higher (recommended)
- **A deployed LeLink contract**: Contract address and ABI

## Installation

### 1. Install Required Dependencies

```bash
npm install @tanstack/react-query wagmi viem zod
# or
yarn add @tanstack/react-query wagmi viem zod
# or
pnpm add @tanstack/react-query wagmi viem zod
```

### 2. Install the LeLink React Package

```bash
npm install @lelink/react
# or
yarn add @lelink/react
# or
pnpm add @lelink/react
```

## Configuration

### 1. Environment Variables

Create a `.env.local` file in your project root:

```env
# Required
NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/your-api-key

# Optional
NEXT_PUBLIC_NETWORK_NAME=mainnet
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://etherscan.io
NEXT_PUBLIC_ENABLE_DEV_TOOLS=false
```

### 2. Create Configuration File

Create `lib/lelink-config.ts`:

```typescript
import { getConfig, type LeLinkConfig } from '@lelink/react/config';

// Override default configuration if needed
export const lelinkConfig: Partial<LeLinkConfig> = {
  // Custom configuration here
  enableDevTools: process.env.NODE_ENV === 'development',
};

// Get the final configuration
export const getLeLinkConfig = () => getConfig(lelinkConfig);
```

## Provider Setup

### 1. Create Web3 Provider (App Router)

Create `app/providers.tsx`:

```typescript
'use client';

import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { config } from '../lib/wagmi-config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 2. Create Wagmi Configuration

Create `lib/wagmi-config.ts`:

```typescript
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, localhost } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

export const config = createConfig({
  chains: [mainnet, sepolia, localhost],
  connectors: [injected(), metaMask(), walletConnect({ projectId })],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [localhost.id]: http('http://localhost:8545'),
  },
});
```

### 3. Update Root Layout

Update `app/layout.tsx`:

```typescript
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Basic Usage

### 1. Connect Wallet Component

Create `components/connect-wallet.tsx`:

```typescript
'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from './ui/button';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button onClick={() => disconnect()} variant="outline">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <Button key={connector.uid} onClick={() => connect({ connector })} disabled={isPending}>
          Connect {connector.name}
        </Button>
      ))}
    </div>
  );
}
```

### 2. Record Management Component

Create `components/record-manager.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRecord, useCreateRecord, useUpdateRecord, useDeleteRecord, useRecordExists } from '@lelink/react/hooks';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from './ui/use-toast';

export function RecordManager() {
  const { address } = useAccount();
  const [resourceId, setResourceId] = useState('');
  const [dataHash, setDataHash] = useState('');

  // Queries
  const { data: recordData, isLoading: recordLoading } = useRecord(resourceId, address, {
    enabled: !!resourceId && !!address,
  });

  const { data: existsData } = useRecordExists(resourceId, address, { enabled: !!resourceId && !!address });

  // Mutations
  const createRecord = useCreateRecord();
  const updateRecord = useUpdateRecord();
  const deleteRecord = useDeleteRecord();

  const handleCreateRecord = async () => {
    if (!address || !resourceId || !dataHash) {
      toast({ title: 'Error', description: 'Please fill all fields' });
      return;
    }

    try {
      await createRecord.mutateAsync({
        resourceId,
        dataHash,
        owner: address,
      });
      toast({ title: 'Success', description: 'Record created successfully' });
      setResourceId('');
      setDataHash('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create record',
      });
    }
  };

  const handleUpdateRecord = async () => {
    if (!resourceId || !dataHash) {
      toast({ title: 'Error', description: 'Please fill all fields' });
      return;
    }

    try {
      await updateRecord.mutateAsync({
        resourceId,
        newDataHash: dataHash,
      });
      toast({ title: 'Success', description: 'Record updated successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update record',
      });
    }
  };

  const handleDeleteRecord = async () => {
    if (!resourceId) {
      toast({ title: 'Error', description: 'Please enter resource ID' });
      return;
    }

    try {
      await deleteRecord.mutateAsync({ resourceId });
      toast({ title: 'Success', description: 'Record deleted successfully' });
      setResourceId('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete record',
      });
    }
  };

  if (!address) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Please connect your wallet to manage records.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Record Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Resource ID</label>
            <Input value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder="Enter resource ID" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Data Hash</label>
            <Input
              value={dataHash}
              onChange={(e) => setDataHash(e.target.value)}
              placeholder="Enter data hash (0x...)"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateRecord} disabled={createRecord.isPending || !existsData || existsData.exists}>
              {createRecord.isPending ? 'Creating...' : 'Create Record'}
            </Button>

            <Button
              onClick={handleUpdateRecord}
              disabled={updateRecord.isPending || !existsData?.exists}
              variant="outline"
            >
              {updateRecord.isPending ? 'Updating...' : 'Update Record'}
            </Button>

            <Button
              onClick={handleDeleteRecord}
              disabled={deleteRecord.isPending || !existsData?.exists}
              variant="destructive"
            >
              {deleteRecord.isPending ? 'Deleting...' : 'Delete Record'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {recordData && existsData?.exists && (
        <Card>
          <CardHeader>
            <CardTitle>Record Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Creator:</span>
                <p className="font-mono">{recordData.creator}</p>
              </div>
              <div>
                <span className="font-medium">Data Hash:</span>
                <p className="font-mono break-all">{recordData.dataHash}</p>
              </div>
              <div>
                <span className="font-medium">Created At:</span>
                <p>{new Date(Number(recordData.createdAt) * 1000).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium">Last Modified:</span>
                <p>{new Date(Number(recordData.lastModified) * 1000).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### 3. Contract Information Component

Create `components/contract-info.tsx`:

```typescript
'use client';

import { useContractInfo, useIsPaused, useRecordCount } from '@lelink/react/hooks';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export function ContractInfo() {
  const { data: contractInfo, isLoading } = useContractInfo();
  const { data: isPaused } = useIsPaused();
  const { data: recordCount } = useRecordCount();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center">Loading contract information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Contract Information
          <Badge variant={isPaused?.paused ? 'destructive' : 'default'}>{isPaused?.paused ? 'Paused' : 'Active'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Contract Address:</span>
            <p className="font-mono break-all">{contractInfo?.contractAddress}</p>
          </div>
          <div>
            <span className="font-medium">Chain ID:</span>
            <p>{contractInfo?.chainId}</p>
          </div>
          <div>
            <span className="font-medium">Network:</span>
            <p className="capitalize">{contractInfo?.networkName || 'Unknown'}</p>
          </div>
          <div>
            <span className="font-medium">Total Records:</span>
            <p>{recordCount?.count?.toString() || '0'}</p>
          </div>
          <div>
            <span className="font-medium">Owner:</span>
            <p className="font-mono break-all">{contractInfo?.owner}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Advanced Patterns

### 1. Custom Hook for Record Management

Create `hooks/use-record-manager.ts`:

```typescript
import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import {
  useRecord,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
  useRecordExists,
  type CreateRecordInput,
} from '@lelink/react/hooks';

export function useRecordManager(initialResourceId?: string) {
  const { address } = useAccount();
  const [resourceId, setResourceId] = useState(initialResourceId || '');

  // Queries
  const recordQuery = useRecord(resourceId, address);
  const existsQuery = useRecordExists(resourceId, address);

  // Mutations
  const createMutation = useCreateRecord();
  const updateMutation = useUpdateRecord();
  const deleteMutation = useDeleteRecord();

  const createRecord = useCallback(
    async (input: Omit<CreateRecordInput, 'owner'>) => {
      if (!address) throw new Error('Wallet not connected');

      return createMutation.mutateAsync({
        ...input,
        owner: address,
      });
    },
    [address, createMutation]
  );

  const updateRecord = useCallback(
    async (newDataHash: string) => {
      return updateMutation.mutateAsync({
        resourceId,
        newDataHash,
      });
    },
    [resourceId, updateMutation]
  );

  const deleteRecord = useCallback(async () => {
    return deleteMutation.mutateAsync({ resourceId });
  }, [resourceId, deleteMutation]);

  return {
    // State
    resourceId,
    setResourceId,

    // Data
    record: recordQuery.data,
    exists: existsQuery.data?.exists ?? false,

    // Loading states
    isLoading: recordQuery.isLoading || existsQuery.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Actions
    createRecord,
    updateRecord,
    deleteRecord,

    // Utilities
    canCreate: !existsQuery.data?.exists && !!address,
    canUpdate: existsQuery.data?.exists ?? false,
    canDelete: existsQuery.data?.exists ?? false,
  };
}
```

### 2. Batch Operations Component

Create `components/batch-operations.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useBatchCreateRecords } from '@lelink/react/hooks';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from './ui/use-toast';

export function BatchOperations() {
  const { address } = useAccount();
  const [batchData, setBatchData] = useState('');
  const batchCreateMutation = useBatchCreateRecords();

  const handleBatchCreate = async () => {
    if (!address) {
      toast({ title: 'Error', description: 'Please connect your wallet' });
      return;
    }

    try {
      const lines = batchData
        .trim()
        .split('\n')
        .filter((line) => line.trim());
      const records = lines.map((line) => {
        const [resourceId, dataHash] = line.split(',').map((s) => s.trim());
        if (!resourceId || !dataHash) {
          throw new Error(`Invalid format in line: ${line}`);
        }
        return { resourceId, dataHash, owner: address };
      });

      await batchCreateMutation.mutateAsync(records);
      toast({ title: 'Success', description: `${records.length} records created successfully` });
      setBatchData('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create batch records',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Batch Data (format: resourceId,dataHash per line)</label>
          <Textarea
            value={batchData}
            onChange={(e) => setBatchData(e.target.value)}
            placeholder={`document1,0x1234567890abcdef...
document2,0xabcdef1234567890...
document3,0x567890abcdef1234...`}
            rows={6}
          />
        </div>

        <Button
          onClick={handleBatchCreate}
          disabled={batchCreateMutation.isPending || !batchData.trim() || !address}
          className="w-full"
        >
          {batchCreateMutation.isPending ? 'Creating Records...' : 'Create Batch Records'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Type Safety

### 1. Strict Type Checking

Ensure your `tsconfig.json` has strict settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 2. Custom Type Guards

Create `lib/type-guards.ts`:

```typescript
import type { Address } from 'viem';

export function isValidAddress(address: unknown): address is Address {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidHash(hash: unknown): hash is `0x${string}` {
  return typeof hash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
```

## Error Handling

### 1. Error Boundary Component

Create `components/error-boundary.tsx`:

```typescript
'use client';

import { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('LeLink Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <Button onClick={() => this.setState({ hasError: false, error: undefined })} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}
```

### 2. Global Error Handler

Create `lib/error-handler.ts`:

```typescript
import { toast } from '@/components/ui/use-toast';

export interface LeErrorContext {
  operation: string;
  resourceId?: string;
  address?: string;
}

export function handleLeError(error: unknown, context: LeErrorContext) {
  console.error(`LeLink Error [${context.operation}]:`, error, context);

  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    if (error.message.includes('User rejected')) {
      message = 'Transaction was rejected by user';
    } else if (error.message.includes('insufficient funds')) {
      message = 'Insufficient funds for transaction';
    } else if (error.message.includes('Record already exists')) {
      message = 'Record already exists';
    } else if (error.message.includes('Record does not exist')) {
      message = 'Record not found';
    } else {
      message = error.message;
    }
  }

  toast({
    title: `Error in ${context.operation}`,
    description: message,
    variant: 'destructive',
  });
}
```

## Performance Optimization

### 1. Query Optimization

Create `lib/query-optimization.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const optimizedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time for different types of data
      staleTime: 1000 * 60 * 5, // 5 minutes for most queries

      // Garbage collection time
      gcTime: 1000 * 60 * 30, // 30 minutes

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry user rejections
        if (error instanceof Error && error.message.includes('User rejected')) {
          return false;
        }
        return failureCount < 3;
      },

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Prefetch commonly used data
export function prefetchContractData(queryClient: QueryClient, address?: string) {
  if (!address) return;

  // Prefetch contract info
  queryClient.prefetchQuery({
    queryKey: ['lelink', 'contract', 'info'],
    staleTime: 1000 * 60 * 10, // 10 minutes for contract info
  });

  // Prefetch record count
  queryClient.prefetchQuery({
    queryKey: ['lelink', 'contract', 'count'],
    staleTime: 1000 * 60 * 2, // 2 minutes for count
  });
}
```

### 2. Lazy Loading

Create `components/lazy-record-list.tsx`:

```typescript
'use client';

import { lazy, Suspense } from 'react';
import { Card, CardContent } from './ui/card';

const RecordList = lazy(() => import('./record-list'));

export function LazyRecordList() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <RecordList />
    </Suspense>
  );
}
```

## Testing

### 1. Test Setup

Create `__tests__/setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### 2. Component Testing

Create `__tests__/components/record-manager.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { RecordManager } from '@/components/record-manager';

const mockUseAccount = vi.fn();
const mockUseRecord = vi.fn();
const mockUseCreateRecord = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: mockUseAccount,
}));

vi.mock('@lelink/react/hooks', () => ({
  useRecord: mockUseRecord,
  useCreateRecord: mockUseCreateRecord,
  useUpdateRecord: vi.fn(),
  useDeleteRecord: vi.fn(),
  useRecordExists: vi.fn(),
}));

describe('RecordManager', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    });

    mockUseRecord.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseCreateRecord.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('renders correctly when wallet is connected', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RecordManager />
      </QueryClientProvider>
    );

    expect(screen.getByText('Record Management')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter resource ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter data hash (0x...)')).toBeInTheDocument();
  });

  it('shows connection prompt when wallet is not connected', () => {
    mockUseAccount.mockReturnValue({
      address: null,
      isConnected: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RecordManager />
      </QueryClientProvider>
    );

    expect(screen.getByText('Please connect your wallet to manage records.')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. RPC Errors

```typescript
// lib/error-recovery.ts
export function handleRpcError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('rate limit')) {
      // Implement exponential backoff
      return new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (error.message.includes('network')) {
      // Switch to backup RPC
      console.warn('Switching to backup RPC endpoint');
    }
  }
  throw error;
}
```

#### 2. Memory Leaks

```typescript
// hooks/use-cleanup.ts
import { useEffect, useRef } from 'react';

export function useCleanup() {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  const addTimeout = (timeout: NodeJS.Timeout) => {
    timeoutsRef.current.push(timeout);
  };

  const addInterval = (interval: NodeJS.Timeout) => {
    intervalsRef.current.push(interval);
  };

  return { addTimeout, addInterval };
}
```

#### 3. Transaction Failures

```typescript
// lib/transaction-recovery.ts
export async function retryTransaction(fn: () => Promise<any>, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Don't retry user rejections
      if (error instanceof Error && error.message.includes('User rejected')) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}
```

## Best Practices

### 1. Code Organization

```
src/
├── app/                    # Next.js app directory
├── components/
│   ├── ui/                # Reusable UI components
│   ├── lelink/            # LeLink-specific components
│   └── providers/         # Provider components
├── hooks/                 # Custom hooks
├── lib/
│   ├── lelink-config.ts   # LeLink configuration
│   ├── wagmi-config.ts    # Wagmi configuration
│   └── utils.ts           # Utilities
├── types/                 # Type definitions
└── __tests__/             # Test files
```

### 2. Environment Management

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  NEXT_PUBLIC_CHAIN_ID: z.string().transform(Number),
  NEXT_PUBLIC_RPC_URL: z.string().url(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS,
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
});
```

### 3. Security Considerations

- Always validate user inputs
- Use environment variables for sensitive configuration
- Implement proper error boundaries
- Sanitize data before displaying
- Use HTTPS in production
- Implement rate limiting for contract calls

### 4. Performance Tips

- Use React.memo for expensive components
- Implement proper loading states
- Use React Query's built-in caching
- Lazy load components when possible
- Optimize bundle size with tree shaking

---

## Next Steps

After completing this integration:

1. **Deploy your application** to Vercel, Netlify, or your preferred platform
2. **Monitor performance** using analytics and error tracking
3. **Implement additional features** like event listening, advanced filtering
4. **Add comprehensive testing** including E2E tests
5. **Set up CI/CD pipelines** for automated testing and deployment

For more advanced use cases and API reference, check out the [API Documentation](./api-reference.md) and [Advanced Patterns](./advanced-patterns.md) guides.
