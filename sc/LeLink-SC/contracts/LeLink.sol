// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LeLink1
 * @dev A smart contract for tracking healthcare data transaction logs.
 * This version addresses security, gas optimization, and functional issues from the original.
 *
 * Key Smart Contract Features:
 * - Clear separation of view and state-modifying functions
 * - Gas optimizations using events instead of storage for transaction history
 * - Enhanced access controls and security checks
 * - Protection against common vulnerabilities
 * - Relies on blockchain events for transaction logging (much more gas efficient)
 * - Record IDs are generated using keccak hash of resourceId string + owner address for uniqueness
 */
contract LeLink is Ownable, Pausable {
    ////////////////////////////////////////////
    //             --- Errors ---             //
    ////////////////////////////////////////////
    error LeLink__RecordDoesNotExist();
    error LeLink__RecordAlreadyExists();
    error LeLink__RecipientAddressCannotBeZero();
    error LeLink__CannotLogSharingToSelf();
    error LeLink__UserAddressCannotBeZero();
    error LeLink__CannotLogRevocationFromSelf();
    error LeLink__NotAuthorized();
    error LeLink__InvalidInput();
    error LeLink__EmptyHashNotAllowed();

    ////////////////////////////////////////////
    //             --- Structs ---             //
    ////////////////////////////////////////////
    /**
     * @dev Represents metadata for a healthcare data record.
     * 'dataHash' is a cryptographic hash of the off-chain healthcare data.
     */
    struct Record {
        address creator;     // The address that initiated the creation of this record
        bytes32 dataHash;    // Cryptographic hash of the actual off-chain healthcare data
        uint64 createdAt;    // Timestamp of creation (optimized to uint64)
        uint64 lastModified; // Timestamp of last modification (optimized to uint64)
    }

    ////////////////////////////////////////////
    //             --- State Variables ---             //
    ////////////////////////////////////////////   
    mapping(bytes32 => Record) private _records;
    uint256 private _recordCount;

    ////////////////////////////////////////////
    //             --- Events ---             //
    ////////////////////////////////////////////
    event DataCreated(bytes32 indexed recordId, address indexed owner, address indexed creator, string resourceId, bytes32 dataHash, uint64 timestamp);
    event DataAccessed(bytes32 indexed recordId, address indexed accessor, string resourceId, uint64 timestamp);
    event DataUpdated(bytes32 indexed recordId, address indexed updater, string resourceId, bytes32 newDataHash, uint64 timestamp);
    event DataDeleted(bytes32 indexed recordId, address indexed deleter, string resourceId, uint64 timestamp);
    event DataShared(bytes32 indexed recordId, address indexed sharer, address indexed recipient, string resourceId, uint64 timestamp);
    event DataAccessRevoked(bytes32 indexed recordId,  address indexed revoker, address indexed revokedUser, string resourceId, uint64 timestamp);

    ////////////////////////////////////////////
    //             --- Modifiers ---           //
    ////////////////////////////////////////////
    /**
     * @dev Throws if the specified recordId does not correspond to an existing record.
     */
    modifier whenExists(string memory _resourceIdStr, address _owner) {
        if (_records[generateRecordId(_resourceIdStr, _owner)].creator == address(0)) {
            revert LeLink__RecordDoesNotExist();
        }
        _;
    }

    /**
     * @dev Throws if the caller is not the creator of the specified record.
     */
    modifier onlyCreator(bytes32 _recordId) {
        if (_records[_recordId].creator != msg.sender) {
            revert LeLink__NotAuthorized();
        }
        _;
    }

    ////////////////////////////////////////////
    //             --- Functions ---           //
    ////////////////////////////////////////////

    //////////////  Constructor  //////////////
    constructor() Ownable(msg.sender) {}


    //////////////  External Functions  //////////////
    /**
     * @dev Creates a new healthcare data record's metadata.
     * @param _resourceIdStr The unique identifier string for the new data record.
     * @param _dataHashStr The cryptographic hash of the actual off-chain healthcare data.
     * @param _owner The address of the record owner.
     */
    function createRecord(string memory _resourceIdStr, string memory _dataHashStr, address _owner) public whenNotPaused {
        bytes32 _recordId = generateRecordId(_resourceIdStr, _owner);
        
        // Validate that data hash is not empty
        if (bytes(_dataHashStr).length == 0) {
            revert LeLink__EmptyHashNotAllowed();
        }
        
        bytes32 _dataHash = stringToBytes32(_dataHashStr);
        
        if (_records[_recordId].creator != address(0)) {
            revert LeLink__RecordAlreadyExists();
        }

        _records[_recordId] = Record({
            creator: msg.sender, 
            dataHash: _dataHash,
            createdAt: uint64(block.timestamp),
            lastModified: uint64(block.timestamp)
        });

        _recordCount++;

        emit DataCreated(_recordId, _owner, msg.sender, _resourceIdStr, _dataHash, uint64(block.timestamp));
    }

 

    /**
     * @dev Logs an access to a healthcare record. Separate from the view function.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     */
    function logAccess(string memory _resourceIdStr, address _owner) external whenNotPaused {
        bytes32 _recordId = generateRecordId(_resourceIdStr, _owner);
        
        if (_records[_recordId].creator == address(0)) {
            revert LeLink__RecordDoesNotExist();
        }

        emit DataAccessed(_recordId, msg.sender, _resourceIdStr, uint64(block.timestamp));
    }

    /**
     * @dev Updates the cryptographic hash of an existing healthcare record.
     * @param _resourceIdStr The original resource ID string.
     * @param _newDataHashStr The new cryptographic hash of the healthcare data.
     */
    function updateRecord(string memory _resourceIdStr, string memory _newDataHashStr) 
        external 
        whenNotPaused 
    {
        bytes32 _recordId = generateRecordId(_resourceIdStr, msg.sender);        
  
        if (bytes(_newDataHashStr).length == 0) {
            revert LeLink__EmptyHashNotAllowed();
        }
        
        bytes32 _newDataHash = stringToBytes32(_newDataHashStr);
        
        if (_records[_recordId].creator == address(0)) {
            revert LeLink__RecordDoesNotExist();
        }
        
        _records[_recordId].dataHash = _newDataHash;
        _records[_recordId].lastModified = uint64(block.timestamp);

        emit DataUpdated(_recordId, msg.sender, _resourceIdStr, _newDataHash, uint64(block.timestamp));
    }

    /**
     * @dev Deletes a healthcare data record's metadata.
     * @param _resourceIdStr The original resource ID string.
     */
    function deleteRecord(string memory _resourceIdStr) 
        external 
        whenNotPaused 
    {
        bytes32 _recordId = generateRecordId(_resourceIdStr, msg.sender);
        
        if (_records[_recordId].creator == address(0)) {
            revert LeLink__RecordDoesNotExist();
        }
        
        if (_records[_recordId].creator != msg.sender) {
            revert LeLink__NotAuthorized();
        }
        
        delete _records[_recordId];
        
        // Safe decrement with underflow check
        unchecked {
            if (_recordCount > 0) {
                _recordCount--;
            }
        }

        emit DataDeleted(_recordId, msg.sender, _resourceIdStr, uint64(block.timestamp));
    }

    /**
     * @dev Allows a record creator to force delete a record (admin function).
     * This function demonstrates the onlyCreator modifier usage.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     */
    function forceDeleteRecord(string memory _resourceIdStr, address _owner) 
        external 
        whenNotPaused 
        onlyCreator(generateRecordId(_resourceIdStr, _owner))
    {
        bytes32 _recordId = generateRecordId(_resourceIdStr, _owner);
        
        if (_records[_recordId].creator == address(0)) {
            revert LeLink__RecordDoesNotExist();
        }
        
        delete _records[_recordId];
        
        // Safe decrement with underflow check
        unchecked {
            if (_recordCount > 0) {
                _recordCount--;
            }
        }

        emit DataDeleted(_recordId, msg.sender, _resourceIdStr, uint64(block.timestamp));
    }

    /**
     * @dev Logs the action of sharing access to a healthcare data record.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     * @param _recipient The address with whom access was shared.
     */
    function logShareAccess(string memory _resourceIdStr, address _owner, address _recipient) 
        external 
        whenNotPaused
        whenExists(_resourceIdStr, _owner)
    {
        bytes32 _recordId = generateRecordId(_resourceIdStr, _owner);
        
        if (_recipient == address(0)) {
            revert LeLink__RecipientAddressCannotBeZero();
        }

        if (_recipient == msg.sender) {
            revert LeLink__CannotLogSharingToSelf();
        }

        emit DataShared(_recordId, msg.sender, _recipient, _resourceIdStr, uint64(block.timestamp));
    }

    /**
     * @dev Logs the action of revoking access to a healthcare data record.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     * @param _userToRevoke The address of the user whose access is being revoked.
     */
    function logRevokeAccess(string memory _resourceIdStr, address _owner, address _userToRevoke) 
        external 
        whenNotPaused
        whenExists(_resourceIdStr, _owner)
    {
        bytes32 _recordId = generateRecordId(_resourceIdStr, _owner);
        
        if (_userToRevoke == address(0)) {
            revert LeLink__UserAddressCannotBeZero();
        }
        
        if (_userToRevoke == msg.sender) {
            revert LeLink__CannotLogRevocationFromSelf();
        }

        emit DataAccessRevoked(_recordId, msg.sender, _userToRevoke, _resourceIdStr, uint64(block.timestamp));
    }

    /** 
     * @dev Pauses the contract.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    //////////////  View or Pure Functions  //////////////

       /**
     * @dev Retrieves the cryptographic hash of a healthcare record.
     * This is a view function and does not modify the contract's state.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     * @return bytes32 The cryptographic hash of the healthcare data.
     */
    function getRecordHash(string memory _resourceIdStr, address _owner) external view returns (bytes32) {
        bytes32 _recordId = generateRecordId(_resourceIdStr, _owner);

        if (_records[_recordId].creator == address(0)) {
            revert LeLink__RecordDoesNotExist();
        }
        return _records[_recordId].dataHash;
    }


    /**
     * @dev Returns the creator's address for a specific health record.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     * @return address The creator's address.
     */
    function getRecordCreator(string memory _resourceIdStr, address _owner) public view whenExists(_resourceIdStr, _owner) returns (address) {
        bytes32 _recordId = generateRecordId(_resourceIdStr, _owner);
        return _records[_recordId].creator;
    }

    /**
     * @dev Returns the total number of active records.
     * @return uint256 The count of records.
     */
    function getRecordCount() public view returns (uint256) {
        return _recordCount;
    }

    /**
     * @dev Returns complete record information for a given resource ID.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     * @return creator The address of the record creator.
     * @return dataHash The cryptographic hash of the healthcare data.
     * @return createdAt The timestamp when the record was created.
     * @return lastModified The timestamp when the record was last modified.
     */
    function getRecord(string memory _resourceIdStr, address _owner) external view whenExists(_resourceIdStr, _owner) returns (
        address creator,
        bytes32 dataHash,
        uint64 createdAt,
        uint64 lastModified
    ) {
        bytes32 _recordId = generateRecordId(_resourceIdStr, _owner);
        
        Record storage record = _records[_recordId];
        return (record.creator, record.dataHash, record.createdAt, record.lastModified);
    }

    /**
     * @dev Returns true if the the record exists.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     * @return bool Whether the record exists.
     */
    function recordExists(string memory _resourceIdStr, address _owner) public view returns (bool) {
        return _records[generateRecordId(_resourceIdStr, _owner)].creator != address(0);
    }

   
    /**
     * @dev Returns the generated record ID for a given resource ID string and owner.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     * @return bytes32 The generated record ID.
     */
    function getRecordId(string memory _resourceIdStr, address _owner) public pure returns (bytes32) {
        return generateRecordId(_resourceIdStr, _owner);
    }

    //////////////  Internal Functions  //////////////
     /**
     * @dev Generates a unique record ID by hashing the resourceId string with the owner's address.
     * This ensures uniqueness even if different users use the same string ID.
     * @param _resourceIdStr The original resource ID string.
     * @param _owner The address of the record owner.
     * @return bytes32 The generated unique record ID.
     */
    function generateRecordId(string memory _resourceIdStr, address _owner) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_resourceIdStr, _owner));
    }

    /**
     * @dev Converts a string to bytes32 for more efficient storage.
     * Properly zero-pads shorter strings.
     */
    function stringToBytes32(string memory _string) internal pure returns (bytes32) {
        bytes memory stringBytes = bytes(_string);
        bytes32 result;
        
        // Copy up to 32 bytes from the string
        uint256 length = stringBytes.length;
        if (length > 32) {
            length = 32;
        }
        
        assembly {
            result := mload(add(stringBytes, 32))
        }
        
        // If string is shorter than 32 bytes, the assembly already zero-pads
        return result;
    }
} 
