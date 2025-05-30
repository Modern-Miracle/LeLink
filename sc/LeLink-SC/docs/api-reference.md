# 📝 LeLink Smart Contract API Reference

Complete reference for all LeLink smart contract functions, events, and data structures. This guide provides everything you need to integrate with and interact with the LeLink contract.

## 📋 Table of Contents

- [Contract Overview](#contract-overview)
- [Data Structures](#data-structures)
- [Events](#events)
- [Core Functions](#core-functions)
- [View Functions](#view-functions)
- [Administrative Functions](#administrative-functions)
- [Error Codes](#error-codes)
- [Usage Examples](#usage-examples)
- [Gas Costs](#gas-costs)

## 🔗 Contract Overview

**Contract Name**: `LeLink`  
**Inherits**: `Ownable`, `Pausable` (OpenZeppelin)  
**License**: MIT  
**Solidity Version**: ^0.8.0

### Key Features

- ✅ Healthcare data transaction logging
- ✅ Cryptographic hash storage
- ✅ Access control and permissions
- ✅ Pausable for emergency stops
- ✅ Gas-optimized event-based architecture
- ✅ HIPAA/GDPR compliance design

## 📊 Data Structures

### Record Struct

```solidity
struct Record {
    address creator;      // Address that created the record
    bytes32 dataHash;     // Cryptographic hash of the healthcare data
    uint64 createdAt;     // Timestamp when created (Unix timestamp)
    uint64 lastModified;  // Timestamp when last modified (Unix timestamp)
}
```

**Field Descriptions:**

- `creator`: The Ethereum address that initially created this record
- `dataHash`: SHA-256 hash of the actual healthcare data (stored off-chain)
- `createdAt`: Unix timestamp when the record was first created
- `lastModified`: Unix timestamp when the record was last updated

### Record ID Generation

Records are identified by a unique `bytes32` ID generated from:

```solidity
bytes32 recordId = keccak256(abi.encodePacked(resourceIdStr, ownerAddress));
```

This ensures:

- ✅ **Uniqueness**: Same resource ID can exist for different owners
- ✅ **Deterministic**: Same inputs always generate same ID
- ✅ **Collision-resistant**: Extremely unlikely hash collisions

## 📢 Events

All LeLink operations emit events for transparent audit trails:

### DataCreated

```solidity
event DataCreated(
    bytes32 indexed recordId,
    address indexed owner,
    address indexed creator,
    string resourceId,
    bytes32 dataHash,
    uint64 timestamp
);
```

**Emitted when**: A new healthcare record is created
**Use for**: Tracking record creation, compliance reporting

### DataAccessed

```solidity
event DataAccessed(
    bytes32 indexed recordId,
    address indexed accessor,
    string resourceId,
    uint64 timestamp
);
```

**Emitted when**: Someone logs access to a record
**Use for**: Audit trails, access monitoring

### DataUpdated

```solidity
event DataUpdated(
    bytes32 indexed recordId,
    address indexed updater,
    string resourceId,
    bytes32 newDataHash,
    uint64 timestamp
);
```

**Emitted when**: Record data hash is updated
**Use for**: Change tracking, data integrity verification

### DataDeleted

```solidity
event DataDeleted(
    bytes32 indexed recordId,
    address indexed deleter,
    string resourceId,
    uint64 timestamp
);
```

**Emitted when**: A record is deleted
**Use for**: Deletion audit trails, compliance

### DataShared

```solidity
event DataShared(
    bytes32 indexed recordId,
    address indexed sharer,
    address indexed recipient,
    string resourceId,
    uint64 timestamp
);
```

**Emitted when**: Access to data is shared with another party
**Use for**: Sharing audit trails, access tracking

### DataAccessRevoked

```solidity
event DataAccessRevoked(
    bytes32 indexed recordId,
    address indexed revoker,
    address indexed revokedUser,
    string resourceId,
    uint64 timestamp
);
```

**Emitted when**: Data access is revoked from a user
**Use for**: Revocation audit trails, access management

## 🔧 Core Functions

### createRecord

Creates a new healthcare data record.

```solidity
function createRecord(
    string memory _resourceIdStr,
    string memory _dataHashStr,
    address _owner
) public whenNotPaused
```

**Parameters:**

- `_resourceIdStr`: Unique identifier string for the healthcare data
- `_dataHashStr`: Cryptographic hash of the actual healthcare data
- `_owner`: Address of the record owner

**Requirements:**

- Contract must not be paused
- Data hash cannot be empty
- Record with same ID must not already exist

**Example:**

```javascript
const tx = await lelink.createRecord(
  'patient-123-record-001',
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23'
);
await tx.wait();
```

### logAccess

Logs access to a healthcare record.

```solidity
function logAccess(
    string memory _resourceIdStr,
    address _owner
) external whenNotPaused
```

**Parameters:**

- `_resourceIdStr`: Resource identifier string
- `_owner`: Address of the record owner

**Requirements:**

- Contract must not be paused
- Record must exist

**Example:**

```javascript
const tx = await lelink.logAccess('patient-123-record-001', '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23');
await tx.wait();
```

### updateRecord

Updates the data hash of an existing record.

```solidity
function updateRecord(
    string memory _resourceIdStr,
    string memory _newDataHashStr
) external whenNotPaused
```

**Parameters:**

- `_resourceIdStr`: Resource identifier string
- `_newDataHashStr`: New cryptographic hash of the updated data

**Requirements:**

- Contract must not be paused
- Caller must be the record creator
- New data hash cannot be empty
- Record must exist

**Example:**

```javascript
const tx = await lelink.updateRecord(
  'patient-123-record-001',
  'b776a66531622f8d418e4968eadf5fc9b05b2f4eff2fb08f999f97g8g8b38bf4'
);
await tx.wait();
```

### deleteRecord

Deletes a healthcare record.

```solidity
function deleteRecord(
    string memory _resourceIdStr
) external whenNotPaused
```

**Parameters:**

- `_resourceIdStr`: Resource identifier string

**Requirements:**

- Contract must not be paused
- Caller must be the record creator
- Record must exist

**Example:**

```javascript
const tx = await lelink.deleteRecord('patient-123-record-001');
await tx.wait();
```

### logShareAccess

Logs sharing of data access with another party.

```solidity
function logShareAccess(
    string memory _resourceIdStr,
    address _owner,
    address _recipient
) external whenNotPaused whenExists(_resourceIdStr, _owner)
```

**Parameters:**

- `_resourceIdStr`: Resource identifier string
- `_owner`: Address of the record owner
- `_recipient`: Address receiving access

**Requirements:**

- Contract must not be paused
- Record must exist
- Recipient address cannot be zero
- Cannot share with yourself

**Example:**

```javascript
const tx = await lelink.logShareAccess(
  'patient-123-record-001',
  '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23',
  '0x8ba1f109551bD432803012645Hac136c30C18308'
);
await tx.wait();
```

### logRevokeAccess

Logs revocation of data access from a user.

```solidity
function logRevokeAccess(
    string memory _resourceIdStr,
    address _owner,
    address _userToRevoke
) external whenNotPaused whenExists(_resourceIdStr, _owner)
```

**Parameters:**

- `_resourceIdStr`: Resource identifier string
- `_owner`: Address of the record owner
- `_userToRevoke`: Address losing access

**Requirements:**

- Contract must not be paused
- Record must exist
- User address cannot be zero
- Cannot revoke from yourself

**Example:**

```javascript
const tx = await lelink.logRevokeAccess(
  'patient-123-record-001',
  '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23',
  '0x8ba1f109551bD432803012645Hac136c30C18308'
);
await tx.wait();
```

## 👁️ View Functions

### getRecord

Returns complete record information.

```solidity
function getRecord(
    string memory _resourceIdStr,
    address _owner
) external view whenExists(_resourceIdStr, _owner) returns (
    address creator,
    bytes32 dataHash,
    uint64 createdAt,
    uint64 lastModified
)
```

**Example:**

```javascript
const record = await lelink.getRecord('patient-123-record-001', '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23');

console.log({
  creator: record.creator,
  dataHash: record.dataHash,
  createdAt: new Date(Number(record.createdAt) * 1000),
  lastModified: new Date(Number(record.lastModified) * 1000),
});
```

### getRecordHash

Returns only the data hash of a record.

```solidity
function getRecordHash(
    string memory _resourceIdStr,
    address _owner
) external view returns (bytes32)
```

**Example:**

```javascript
const dataHash = await lelink.getRecordHash('patient-123-record-001', '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23');
```

### recordExists

Checks if a record exists.

```solidity
function recordExists(
    string memory _resourceIdStr,
    address _owner
) public view returns (bool)
```

**Example:**

```javascript
const exists = await lelink.recordExists('patient-123-record-001', '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23');
```

### getRecordCount

Returns total number of active records.

```solidity
function getRecordCount() public view returns (uint256)
```

**Example:**

```javascript
const count = await lelink.getRecordCount();
console.log(`Total records: ${count.toString()}`);
```

### getRecordId

Returns the generated record ID for given parameters.

```solidity
function getRecordId(
    string memory _resourceIdStr,
    address _owner
) public pure returns (bytes32)
```

**Example:**

```javascript
const recordId = await lelink.getRecordId('patient-123-record-001', '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23');
```

## 🔐 Administrative Functions

### pause

Pauses all contract operations (owner only).

```solidity
function pause() external onlyOwner
```

**Example:**

```javascript
const tx = await lelink.pause();
await tx.wait();
```

### unpause

Unpauses contract operations (owner only).

```solidity
function unpause() external onlyOwner
```

**Example:**

```javascript
const tx = await lelink.unpause();
await tx.wait();
```

### forceDeleteRecord

Force deletes a record (creator only).

```solidity
function forceDeleteRecord(
    string memory _resourceIdStr,
    address _owner
) external whenNotPaused onlyCreator(generateRecordId(_resourceIdStr, _owner))
```

**Example:**

```javascript
const tx = await lelink.forceDeleteRecord('patient-123-record-001', '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23');
await tx.wait();
```

## ❌ Error Codes

LeLink uses custom errors for gas efficiency:

```solidity
error LeLink__RecordDoesNotExist();          // Record not found
error LeLink__RecordAlreadyExists();         // Record already exists
error LeLink__RecipientAddressCannotBeZero(); // Invalid recipient address
error LeLink__CannotLogSharingToSelf();      // Cannot share with yourself
error LeLink__UserAddressCannotBeZero();     // Invalid user address
error LeLink__CannotLogRevocationFromSelf(); // Cannot revoke from yourself
error LeLink__NotAuthorized();               // Access denied
error LeLink__InvalidInput();                // Invalid function input
error LeLink__EmptyHashNotAllowed();         // Empty data hash provided
```

## 💡 Usage Examples

### Complete Healthcare Record Workflow

```javascript
// 1. Connect to deployed contract
const LeLink = await ethers.getContractFactory('LeLink');
const lelink = LeLink.attach('CONTRACT_ADDRESS');

// 2. Create a new record
const resourceId = 'patient-456-visit-20240115';
const dataHash = 'c887a75934322f9d518f5078faef6fc0c16c3f5fff3fb19f1a9f98h9h9c49cf5';
const owner = '0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23';

const createTx = await lelink.createRecord(resourceId, dataHash, owner);
await createTx.wait();
console.log('✅ Record created');

// 3. Log access to the record
const accessTx = await lelink.logAccess(resourceId, owner);
await accessTx.wait();
console.log('✅ Access logged');

// 4. Share access with another party
const specialist = '0x8ba1f109551bD432803012645Hac136c30C18308';
const shareTx = await lelink.logShareAccess(resourceId, owner, specialist);
await shareTx.wait();
console.log('✅ Access shared');

// 5. Update the record with new data
const newDataHash = 'd998b86045433g0e629g6189gbfg7gd1d27d4g6ggg4gc20g2b0g99i0i0d50dg6';
const updateTx = await lelink.updateRecord(resourceId, newDataHash);
await updateTx.wait();
console.log('✅ Record updated');

// 6. Revoke access from the specialist
const revokeTx = await lelink.logRevokeAccess(resourceId, owner, specialist);
await revokeTx.wait();
console.log('✅ Access revoked');

// 7. Query final record state
const record = await lelink.getRecord(resourceId, owner);
console.log('📋 Final record:', {
  creator: record.creator,
  dataHash: record.dataHash,
  createdAt: new Date(Number(record.createdAt) * 1000),
  lastModified: new Date(Number(record.lastModified) * 1000),
});
```

### Event Listening for Audit Trails

```javascript
// Listen for all data creation events
lelink.on('DataCreated', (recordId, owner, creator, resourceId, dataHash, timestamp) => {
  console.log('📝 New record created:', {
    recordId,
    owner,
    creator,
    resourceId,
    dataHash,
    timestamp: new Date(Number(timestamp) * 1000),
  });
});

// Listen for access events
lelink.on('DataAccessed', (recordId, accessor, resourceId, timestamp) => {
  console.log('👁️ Record accessed:', {
    recordId,
    accessor,
    resourceId,
    timestamp: new Date(Number(timestamp) * 1000),
  });
});

// Listen for sharing events
lelink.on('DataShared', (recordId, sharer, recipient, resourceId, timestamp) => {
  console.log('🤝 Access shared:', {
    recordId,
    sharer,
    recipient,
    resourceId,
    timestamp: new Date(Number(timestamp) * 1000),
  });
});
```

### Batch Operations for Gas Efficiency

```javascript
// Create multiple records in sequence
const records = [
  { id: 'patient-123-lab-001', hash: 'hash1', owner: '0x742...' },
  { id: 'patient-123-lab-002', hash: 'hash2', owner: '0x742...' },
  { id: 'patient-123-lab-003', hash: 'hash3', owner: '0x742...' },
];

for (const record of records) {
  const tx = await lelink.createRecord(record.id, record.hash, record.owner);
  await tx.wait();
  console.log(`✅ Created record: ${record.id}`);
}
```

## ⛽ Gas Costs

Approximate gas costs for common operations:

| Operation         | Gas Cost | USD Cost\* |
| ----------------- | -------- | ---------- |
| `createRecord`    | ~120,000 | $3.60      |
| `logAccess`       | ~45,000  | $1.35      |
| `updateRecord`    | ~80,000  | $2.40      |
| `deleteRecord`    | ~60,000  | $1.80      |
| `logShareAccess`  | ~50,000  | $1.50      |
| `logRevokeAccess` | ~50,000  | $1.50      |
| View functions    | ~25,000  | $0.75      |

_Estimates based on 30 gwei gas price and $2,000 ETH price_

### Gas Optimization Tips

1. **Use events for history**: Events are much cheaper than storage
2. **Batch operations**: Group multiple actions when possible
3. **Choose efficient networks**: Consider Polygon or BSC for lower costs
4. **Optimize data structures**: Use appropriate integer sizes (uint64 vs uint256)

## 🔗 Integration Patterns

### Healthcare Application Integration

```javascript
class HealthcareDataTracker {
  constructor(contractAddress, provider) {
    this.contract = new ethers.Contract(contractAddress, abi, provider);
  }

  async createPatientRecord(patientId, dataHash, ownerAddress) {
    const resourceId = `patient-${patientId}-${Date.now()}`;
    const tx = await this.contract.createRecord(resourceId, dataHash, ownerAddress);
    return tx.wait();
  }

  async trackDataAccess(resourceId, ownerAddress) {
    const tx = await this.contract.logAccess(resourceId, ownerAddress);
    return tx.wait();
  }

  async getAuditTrail(resourceId, ownerAddress) {
    const recordId = await this.contract.getRecordId(resourceId, ownerAddress);

    // Query events for this record
    const filter = this.contract.filters.DataAccessed(recordId);
    const events = await this.contract.queryFilter(filter);

    return events.map((event) => ({
      accessor: event.args.accessor,
      timestamp: new Date(Number(event.args.timestamp) * 1000),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    }));
  }
}
```

### React Hook for LeLink Integration

```javascript
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function useLeLink(contractAddress, provider) {
  const [contract, setContract] = useState(null);
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    if (contractAddress && provider) {
      const leLinkContract = new ethers.Contract(contractAddress, abi, provider);
      setContract(leLinkContract);

      // Get initial record count
      leLinkContract.getRecordCount().then(setRecordCount);
    }
  }, [contractAddress, provider]);

  const createRecord = async (resourceId, dataHash, owner) => {
    if (!contract) return;
    const tx = await contract.createRecord(resourceId, dataHash, owner);
    return tx.wait();
  };

  const getRecord = async (resourceId, owner) => {
    if (!contract) return null;
    return contract.getRecord(resourceId, owner);
  };

  return {
    contract,
    recordCount,
    createRecord,
    getRecord,
  };
}
```

---

**Need more examples?** Check out our [Examples Guide](./examples.md) for real-world implementation patterns.

**Having issues?** See our [Troubleshooting Guide](./troubleshooting.md) for common problems and solutions.
