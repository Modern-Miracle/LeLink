# LeLink React Integration

A comprehensive React integration for the LeLink smart contract, providing type-safe hooks and utilities for managing decentralized data records.

## 📁 Project Structure

```
react/
├── actions/
│   ├── types.ts          # TypeScript interfaces and types
│   ├── schema.ts         # Input validation schemas
│   ├── query.ts          # Read-only contract functions
│   └── mutations.ts      # Write contract functions
├── hooks/
│   └── use-lelink.ts     # React hooks for contract interactions
├── abi/
│   └── lelink.abi.ts     # Contract ABI definition
├── config.ts             # Configuration and network settings
└── README.md             # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

First, install the required dependencies in your React project:

```bash
npm install @tanstack/react-query wagmi viem
# or
yarn add @tanstack/react-query wagmi viem
```

### 2. Update Contract Address

Edit `config.ts` and update the contract addresses for your deployed networks:

```typescript
export const NETWORK_CONFIGS: Record<string, LeLinkConfig> = {
  localhost: {
    contractAddress: '0xYourLocalContractAddress' as `0x${string}`,
    // ... other config
  },
  sepolia: {
    contractAddress: '0xYourSepoliaContractAddress' as `0x${string}`,
    // ... other config
  },
  // ... other networks
};
```

### 3. Setup Environment Variables

Create a `.env.local` file in your project root:

```bash
# LeLink Contract Configuration
NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_BLOCK_EXPLORER=https://etherscan.io
NEXT_PUBLIC_NETWORK_NAME=Localhost
```

### 4. Setup Wagmi Provider (Required)

Wrap your app with the necessary providers:

```tsx
import { WagmiConfig, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia, localhost } from 'wagmi/chains';

const config = createConfig({
  // Your wagmi configuration
});

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>{/* Your app components */}</QueryClientProvider>
    </WagmiConfig>
  );
}
```

## 📖 Usage Examples

### Reading Contract Data

```tsx
import { useRecord, useRecordExists, useRecordCount, useContractInfo } from './react/hooks/use-lelink';

function RecordViewer({ resourceId, owner }: { resourceId: string; owner: string }) {
  const { data: record, isLoading, error } = useRecord(resourceId, owner);
  const { data: exists } = useRecordExists(resourceId, owner);
  const { data: recordCount } = useRecordCount();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!exists?.exists) return <div>Record not found</div>;

  return (
    <div>
      <h2>Record Details</h2>
      <p>Resource ID: {resourceId}</p>
      <p>Owner: {owner}</p>
      <p>Creator: {record?.creator}</p>
      <p>Data Hash: {record?.dataHash}</p>
      <p>Created: {new Date(Number(record?.createdAt) * 1000).toLocaleString()}</p>
      <p>Last Modified: {new Date(Number(record?.lastModified) * 1000).toLocaleString()}</p>
      <p>Total Records: {recordCount?.count.toString()}</p>
    </div>
  );
}
```

### Creating Records

```tsx
import { useCreateRecord } from './react/hooks/use-lelink';

function CreateRecordForm() {
  const createRecord = useCreateRecord();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createRecord.mutateAsync({
        resourceId: 'my-resource-123',
        dataHash: '0x1234567890abcdef...',
        owner: '0xOwnerAddress...',
      });
      console.log('Record created successfully!');
    } catch (error) {
      console.error('Failed to create record:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={createRecord.isPending}>
        {createRecord.isPending ? 'Creating...' : 'Create Record'}
      </button>
    </form>
  );
}
```

### Managing Records

```tsx
import { useUpdateRecord, useDeleteRecord, useLogAccess } from './react/hooks/use-lelink';

function RecordManager({ resourceId }: { resourceId: string }) {
  const updateRecord = useUpdateRecord();
  const deleteRecord = useDeleteRecord();
  const logAccess = useLogAccess();

  const handleUpdate = async () => {
    await updateRecord.mutateAsync({
      resourceId,
      newDataHash: '0xnewhashere...',
    });
  };

  const handleDelete = async () => {
    await deleteRecord.mutateAsync({
      resourceId,
    });
  };

  const handleLogAccess = async () => {
    await logAccess.mutateAsync({
      resourceId,
      owner: '0xOwnerAddress...',
    });
  };

  return (
    <div>
      <button onClick={handleUpdate}>Update Record</button>
      <button onClick={handleDelete}>Delete Record</button>
      <button onClick={handleLogAccess}>Log Access</button>
    </div>
  );
}
```

### Batch Operations

```tsx
import { useBatchCreateRecords } from './react/hooks/use-lelink';

function BatchRecordCreator() {
  const batchCreate = useBatchCreateRecords();

  const handleBatchCreate = async () => {
    const records = [
      {
        resourceId: 'resource-1',
        dataHash: '0xhash1...',
        owner: '0xowner1...',
      },
      {
        resourceId: 'resource-2',
        dataHash: '0xhash2...',
        owner: '0xowner2...',
      },
    ];

    await batchCreate.mutateAsync(records);
  };

  return <button onClick={handleBatchCreate}>Create Multiple Records</button>;
}
```

## 🔧 Available Hooks

### Query Hooks (Read Operations)

- `useRecord(resourceId, owner)` - Get complete record information
- `useRecordCreator(resourceId, owner)` - Get record creator address
- `useRecordHash(resourceId, owner)` - Get record data hash
- `useRecordId(resourceId, owner)` - Generate/get record ID
- `useRecordExists(resourceId, owner)` - Check if record exists
- `useRecordCount()` - Get total number of records
- `useContractOwner()` - Get contract owner address
- `useIsPaused()` - Check if contract is paused
- `useContractInfo()` - Get contract summary information
- `useMultipleRecords(records)` - Get multiple records efficiently
- `useRecordDetails(resourceId, owner)` - Get comprehensive record info

### Mutation Hooks (Write Operations)

- `useCreateRecord()` - Create a new record
- `useUpdateRecord()` - Update existing record data
- `useDeleteRecord()` - Delete a record
- `useForceDeleteRecord()` - Admin force delete
- `useBatchCreateRecords()` - Create multiple records
- `useLogAccess()` - Log data access
- `useLogShareAccess()` - Log data sharing
- `useLogRevokeAccess()` - Log access revocation
- `useTransferOwnership()` - Transfer contract ownership
- `useRenounceOwnership()` - Renounce contract ownership
- `usePauseContract()` - Pause the contract
- `useUnpauseContract()` - Unpause the contract

## 📝 TypeScript Interfaces

### Core Types

```typescript
interface CreateRecordInput {
  resourceId: string;
  dataHash: string;
  owner: `0x${string}`;
}

interface GetRecordResponse {
  creator: `0x${string}`;
  dataHash: `0x${string}`;
  createdAt: bigint;
  lastModified: bigint;
}

interface RecordInfo {
  resourceId: string;
  owner: `0x${string}`;
  creator: `0x${string}`;
  dataHash: `0x${string}`;
  createdAt: bigint;
  lastModified: bigint;
}
```

## 🔒 Access Control

The LeLink contract includes the following access controls:

- **Owner-only functions**: `transferOwnership`, `renounceOwnership`, `pause`, `unpause`, `forceDeleteRecord`
- **Record owner functions**: `updateRecord`, `deleteRecord`
- **Public functions**: `createRecord`, `logAccess`, `logShareAccess`, `logRevokeAccess`
- **View functions**: All query operations are public

## 🧪 Testing

To test your integration:

1. **Set up a local blockchain**:

   ```bash
   npx hardhat node
   ```

2. **Deploy the contract**:

   ```bash
   npx hardhat run scripts/deploy.ts --network localhost
   ```

3. **Update your config** with the deployed contract address

4. **Test the hooks** in your React components

## 🚨 Important Notes

### Current Limitations

1. **Wagmi Integration**: The hooks currently have wagmi imports commented out. You'll need to:

   - Install wagmi and viem
   - Uncomment the wagmi-related imports
   - Set up proper wallet connection

2. **Toast Notifications**: The useToast hook is commented out. You'll need to:

   - Implement your own toast system, or
   - Install a toast library like react-hot-toast

3. **Error Handling**: Add proper error boundaries and user feedback

### Required Setup Steps

1. **Install dependencies**:

   ```bash
   npm install @tanstack/react-query wagmi viem
   ```

2. **Set up environment variables**

3. **Configure wagmi provider**

4. **Update contract addresses in config.ts**

5. **Implement toast notifications (optional)**

## 🔧 Configuration

### Environment Variables

| Variable                              | Description                 | Example                             |
| ------------------------------------- | --------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS` | Deployed contract address   | `0x1234...`                         |
| `NEXT_PUBLIC_CHAIN_ID`                | Network chain ID            | `1` (mainnet), `11155111` (sepolia) |
| `NEXT_PUBLIC_RPC_URL`                 | RPC endpoint URL            | `https://mainnet.infura.io/v3/...`  |
| `NEXT_PUBLIC_BLOCK_EXPLORER`          | Block explorer URL          | `https://etherscan.io`              |
| `NEXT_PUBLIC_NETWORK_NAME`            | Human-readable network name | `Ethereum Mainnet`                  |

### Network Support

The integration supports multiple networks out of the box:

- Localhost (Hardhat/Ganache)
- Ethereum Mainnet
- Sepolia Testnet
- Polygon
- Polygon Mumbai

## 📚 Additional Resources

- [Wagmi Documentation](https://wagmi.sh/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Viem Documentation](https://viem.sh/)
- [LeLink Smart Contract Repository](../../)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
