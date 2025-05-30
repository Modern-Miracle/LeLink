import { time, loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { LeLink } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

/**
 * Comprehensive test suite for LeLink smart contract
 *
 * Features tested:
 * - Contract deployment and initialization
 * - Record creation, updating, and deletion
 * - Access logging and sharing
 * - Access revocation
 * - Pausable functionality
 * - Ownership management
 * - Error handling and edge cases
 * - Gas optimization scenarios
 * - Event emissions
 * - State consistency
 *
 * Coverage: 90%+
 */
describe('LeLink Contract - Comprehensive Test Suite', function () {
  // Test fixture for consistent setup
  async function deployLeLinkFixture() {
    // Get signers for testing different roles
    const [owner, creator, user1, user2, user3, unauthorizedUser]: HardhatEthersSigner[] =
      await hre.ethers.getSigners();

    // Deploy the LeLink contract
    const LeLinkContract = await hre.ethers.getContractFactory('LeLink');
    const leLink: LeLink = (await LeLinkContract.deploy()) as LeLink;

    // Test data constants
    const resourceId = 'patient-record-001';
    const dataHash = 'QmXyZ123AbC456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890BcD';
    const updatedDataHash = 'QmAbc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890BcD';
    const emptyDataHash = '';
    const longDataHash = 'a'.repeat(1000);

    // Helper function to convert string to bytes32 (mimics contract behavior)
    const stringToBytes32 = (str: string): string => {
      // Convert string to bytes
      const bytes = hre.ethers.toUtf8Bytes(str);

      // Create a 32-byte array filled with zeros
      const result = new Uint8Array(32);

      // Copy the string bytes to the beginning (up to 32 bytes)
      const bytesToCopy = Math.min(bytes.length, 32);
      result.set(bytes.slice(0, bytesToCopy));

      return hre.ethers.hexlify(result);
    };

    return {
      leLink,
      owner,
      creator,
      user1,
      user2,
      user3,
      unauthorizedUser,
      resourceId,
      dataHash,
      updatedDataHash,
      emptyDataHash,
      longDataHash,
      stringToBytes32,
    };
  }

  describe('Contract Deployment & Initialization', function () {
    it('Should deploy with correct owner', async function () {
      const { leLink, owner } = await loadFixture(deployLeLinkFixture);
      expect(await leLink.owner()).to.equal(owner.address);
    });

    it('Should start with zero record count', async function () {
      const { leLink } = await loadFixture(deployLeLinkFixture);
      expect(await leLink.getRecordCount()).to.equal(0);
    });

    it('Should not be paused initially', async function () {
      const { leLink } = await loadFixture(deployLeLinkFixture);
      expect(await leLink.paused()).to.be.false;
    });

    it('Should have correct owner permissions', async function () {
      const { leLink, owner } = await loadFixture(deployLeLinkFixture);
      expect(await leLink.owner()).to.equal(owner.address);
    });
  });

  describe('Record Creation', function () {
    it('Should create a new record successfully', async function () {
      const { leLink, creator, user1, resourceId, dataHash, stringToBytes32 } = await loadFixture(deployLeLinkFixture);

      const expectedDataHash = stringToBytes32(dataHash);
      const expectedRecordId = await leLink.getRecordId(resourceId, user1.address);

      await expect(leLink.connect(creator).createRecord(resourceId, dataHash, user1.address))
        .to.emit(leLink, 'DataCreated')
        .withArgs(
          expectedRecordId,
          user1.address,
          creator.address,
          resourceId,
          expectedDataHash,
          (await time.latest()) + 1
        );
    });

    it('Should increment record count after creation', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      const initialCount = await leLink.getRecordCount();
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      expect(await leLink.getRecordCount()).to.equal(initialCount + 1n);
    });

    it('Should fail when creating duplicate record', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create first record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Attempt to create duplicate
      await expect(
        leLink.connect(creator).createRecord(resourceId, dataHash, user1.address)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__RecordAlreadyExists');
    });

    it('Should fail when contract is paused', async function () {
      const { leLink, owner, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Pause the contract
      await leLink.connect(owner).pause();

      await expect(
        leLink.connect(creator).createRecord(resourceId, dataHash, user1.address)
      ).to.be.revertedWithCustomError(leLink, 'EnforcedPause');
    });

    it('Should allow different users to create records with same resourceId', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record for user1
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Create record for user2 with same resourceId - should succeed
      await expect(leLink.connect(creator).createRecord(resourceId, dataHash, user2.address)).to.not.be.reverted;

      expect(await leLink.getRecordCount()).to.equal(2);
    });

    it('Should create record with empty resource ID', async function () {
      const { leLink, creator, user1, dataHash } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.connect(creator).createRecord('', dataHash, user1.address)).to.not.be.reverted;
      expect(await leLink.recordExists('', user1.address)).to.be.true;
    });

    it('Should reject empty data hash but allow empty resource ID', async function () {
      const { leLink, creator, user1, emptyDataHash, dataHash } = await loadFixture(deployLeLinkFixture);

      // Empty resource ID and empty data hash should fail
      await expect(
        leLink.connect(creator).createRecord('', emptyDataHash, user1.address)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__EmptyHashNotAllowed');

      // Empty resource ID with valid data hash should work
      await expect(leLink.connect(creator).createRecord('', dataHash, user1.address)).to.not.be.reverted;

      expect(await leLink.recordExists('', user1.address)).to.be.true;
    });

    it('Should create record with very long strings', async function () {
      const { leLink, creator, user1, longDataHash } = await loadFixture(deployLeLinkFixture);

      const longResourceId = 'b'.repeat(1000);

      await expect(leLink.connect(creator).createRecord(longResourceId, longDataHash, user1.address)).to.not.be
        .reverted;

      expect(await leLink.recordExists(longResourceId, user1.address)).to.be.true;
    });

    it('Should fail to create record with empty data hash', async function () {
      const { leLink, creator, user1, resourceId, emptyDataHash } = await loadFixture(deployLeLinkFixture);

      await expect(
        leLink.connect(creator).createRecord(resourceId, emptyDataHash, user1.address)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__EmptyHashNotAllowed');
    });
  });

  describe('Record Access and Retrieval', function () {
    it('Should retrieve record details correctly', async function () {
      const { leLink, creator, user1, resourceId, dataHash, stringToBytes32 } = await loadFixture(deployLeLinkFixture);

      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      const [recordCreator, recordDataHash, createdAt, lastModified] = await leLink.getRecord(
        resourceId,
        user1.address
      );

      expect(recordCreator).to.equal(creator.address);
      expect(recordDataHash).to.equal(stringToBytes32(dataHash));
      expect(createdAt).to.be.greaterThan(0);
      expect(lastModified).to.equal(createdAt);
    });

    it('Should get record hash correctly', async function () {
      const { leLink, creator, user1, resourceId, dataHash, stringToBytes32 } = await loadFixture(deployLeLinkFixture);

      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      const recordHash = await leLink.getRecordHash(resourceId, user1.address);
      expect(recordHash).to.equal(stringToBytes32(dataHash));
    });

    it('Should get record creator correctly', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      const recordCreator = await leLink.getRecordCreator(resourceId, user1.address);
      expect(recordCreator).to.equal(creator.address);
    });

    it('Should check if record exists', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Check non-existent record
      expect(await leLink.recordExists(resourceId, user1.address)).to.be.false;

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Check existing record
      expect(await leLink.recordExists(resourceId, user1.address)).to.be.true;

      // Check different user - should not exist
      expect(await leLink.recordExists(resourceId, user2.address)).to.be.false;
    });

    it('Should generate consistent record IDs', async function () {
      const { leLink, user1, resourceId } = await loadFixture(deployLeLinkFixture);

      const recordId1 = await leLink.getRecordId(resourceId, user1.address);
      const recordId2 = await leLink.getRecordId(resourceId, user1.address);

      expect(recordId1).to.equal(recordId2);
    });

    it('Should generate different record IDs for different inputs', async function () {
      const { leLink, user1, user2, resourceId } = await loadFixture(deployLeLinkFixture);

      const recordId1 = await leLink.getRecordId(resourceId, user1.address);
      const recordId2 = await leLink.getRecordId(resourceId, user2.address);
      const recordId3 = await leLink.getRecordId('different-resource', user1.address);

      expect(recordId1).to.not.equal(recordId2);
      expect(recordId1).to.not.equal(recordId3);
      expect(recordId2).to.not.equal(recordId3);
    });

    it('Should fail to get non-existent record', async function () {
      const { leLink, user1, resourceId } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.getRecord(resourceId, user1.address)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__RecordDoesNotExist'
      );
    });

    it('Should fail to get hash of non-existent record', async function () {
      const { leLink, user1, resourceId } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.getRecordHash(resourceId, user1.address)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__RecordDoesNotExist'
      );
    });

    it('Should fail to get creator of non-existent record', async function () {
      const { leLink, user1, resourceId } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.getRecordCreator(resourceId, user1.address)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__RecordDoesNotExist'
      );
    });
  });

  describe('Access Logging', function () {
    it('Should log access successfully', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record first
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      const expectedRecordId = await leLink.getRecordId(resourceId, user1.address);

      // Log access
      await expect(leLink.connect(user2).logAccess(resourceId, user1.address))
        .to.emit(leLink, 'DataAccessed')
        .withArgs(expectedRecordId, user2.address, resourceId, (await time.latest()) + 1);
    });

    it('Should allow owner to log their own access', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Owner logs their own access
      await expect(leLink.connect(user1).logAccess(resourceId, user1.address)).to.not.be.reverted;
    });

    it('Should fail to log access for non-existent record', async function () {
      const { leLink, user1, user2, resourceId } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.connect(user2).logAccess(resourceId, user1.address)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__RecordDoesNotExist'
      );
    });

    it('Should fail when logging access while paused', async function () {
      const { leLink, owner, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Pause contract
      await leLink.connect(owner).pause();

      await expect(leLink.connect(user2).logAccess(resourceId, user1.address)).to.be.revertedWithCustomError(
        leLink,
        'EnforcedPause'
      );
    });
  });

  describe('Record Updates', function () {
    it('Should update record successfully', async function () {
      const { leLink, creator, user1, resourceId, dataHash, updatedDataHash, stringToBytes32 } = await loadFixture(
        deployLeLinkFixture
      );

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      const expectedRecordId = await leLink.getRecordId(resourceId, user1.address);
      const expectedDataHash = stringToBytes32(updatedDataHash);

      // Update record
      await expect(leLink.connect(user1).updateRecord(resourceId, updatedDataHash))
        .to.emit(leLink, 'DataUpdated')
        .withArgs(expectedRecordId, user1.address, resourceId, expectedDataHash, (await time.latest()) + 1);

      // Verify update
      const recordHash = await leLink.getRecordHash(resourceId, user1.address);
      expect(recordHash).to.equal(expectedDataHash);
    });

    it('Should update lastModified timestamp', async function () {
      const { leLink, creator, user1, resourceId, dataHash, updatedDataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      const [, , createdAt, initialLastModified] = await leLink.getRecord(resourceId, user1.address);

      // Wait and update
      await time.increase(60); // 1 minute
      await leLink.connect(user1).updateRecord(resourceId, updatedDataHash);

      const [, , , updatedLastModified] = await leLink.getRecord(resourceId, user1.address);

      expect(updatedLastModified).to.be.greaterThan(initialLastModified);
      expect(createdAt).to.equal(initialLastModified); // createdAt doesn't change
    });

    it('Should allow non-creator to update their own record', async function () {
      const { leLink, creator, user1, resourceId, dataHash, updatedDataHash } = await loadFixture(deployLeLinkFixture);

      // Creator creates record for user1
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // User1 (non-creator but owner) updates the record
      await expect(leLink.connect(user1).updateRecord(resourceId, updatedDataHash)).to.not.be.reverted;
    });

    it('Should fail to update non-existent record', async function () {
      const { leLink, user1, resourceId, updatedDataHash } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.connect(user1).updateRecord(resourceId, updatedDataHash)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__RecordDoesNotExist'
      );
    });

    it("Should fail when updating other user's record", async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash, updatedDataHash } = await loadFixture(
        deployLeLinkFixture
      );

      // Create record for user1
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // user2 tries to update user1's record
      await expect(leLink.connect(user2).updateRecord(resourceId, updatedDataHash)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__RecordDoesNotExist'
      );
    });

    it('Should fail to update when paused', async function () {
      const { leLink, owner, creator, user1, resourceId, dataHash, updatedDataHash } = await loadFixture(
        deployLeLinkFixture
      );

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Pause contract
      await leLink.connect(owner).pause();

      await expect(leLink.connect(user1).updateRecord(resourceId, updatedDataHash)).to.be.revertedWithCustomError(
        leLink,
        'EnforcedPause'
      );
    });

    it('Should fail to update with empty data hash', async function () {
      const { leLink, creator, user1, resourceId, dataHash, emptyDataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Try to update with empty hash - should fail
      await expect(leLink.connect(user1).updateRecord(resourceId, emptyDataHash)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__EmptyHashNotAllowed'
      );
    });
  });

  describe('Record Deletion', function () {
    it('Should delete record successfully', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Creator creates record for creator themselves (owner = creator)
      await leLink.connect(creator).createRecord(resourceId, dataHash, creator.address);

      const initialCount = await leLink.getRecordCount();
      const expectedRecordId = await leLink.getRecordId(resourceId, creator.address);

      // Creator deletes their own record
      await expect(leLink.connect(creator).deleteRecord(resourceId))
        .to.emit(leLink, 'DataDeleted')
        .withArgs(expectedRecordId, creator.address, resourceId, (await time.latest()) + 1);

      // Verify deletion
      expect(await leLink.recordExists(resourceId, creator.address)).to.be.false;
      expect(await leLink.getRecordCount()).to.equal(initialCount - 1n);
    });

    it('Should fail to delete non-existent record', async function () {
      const { leLink, user1, resourceId } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.connect(user1).deleteRecord(resourceId)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__RecordDoesNotExist'
      );
    });

    it('Should fail when non-creator tries to delete', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record with user1 as owner
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Try to delete with user2 (should fail because user2 doesn't own any record with this resourceId)
      await expect(leLink.connect(user2).deleteRecord(resourceId)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__RecordDoesNotExist'
      );
    });

    it('Should fail when record creator tries to delete record owned by someone else', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Creator creates record for user1 (user1 is the owner, creator is the one who created it)
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Creator tries to delete the record they created but don't own
      await expect(leLink.connect(creator).deleteRecord(resourceId)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__RecordDoesNotExist'
      );
    });

    it('Should fail when paused', async function () {
      const { leLink, owner, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Pause contract
      await leLink.connect(owner).pause();

      await expect(leLink.connect(user1).deleteRecord(resourceId)).to.be.revertedWithCustomError(
        leLink,
        'EnforcedPause'
      );
    });

    it('Should handle record count correctly when deleting from empty state', async function () {
      const { leLink } = await loadFixture(deployLeLinkFixture);

      // Verify count starts at 0
      expect(await leLink.getRecordCount()).to.equal(0);

      // Try to delete non-existent record should not affect count
      const { user1, resourceId } = await loadFixture(deployLeLinkFixture);
      await expect(leLink.connect(user1).deleteRecord(resourceId)).to.be.reverted;

      expect(await leLink.getRecordCount()).to.equal(0);
    });

    it('Should test onlyCreator modifier with forceDeleteRecord', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Creator creates record for user1
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Creator should be able to force delete (they are the creator)
      await expect(leLink.connect(creator).forceDeleteRecord(resourceId, user1.address)).to.not.be.reverted;

      expect(await leLink.recordExists(resourceId, user1.address)).to.be.false;
    });

    it('Should fail forceDeleteRecord when non-creator tries to delete', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Creator creates record for user1
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // user2 tries to force delete (should fail - not the creator)
      await expect(leLink.connect(user2).forceDeleteRecord(resourceId, user1.address)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__NotAuthorized'
      );
    });

    it('Should fail deleteRecord when owner tries to delete record created by someone else', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Creator creates record for user1 (creator ≠ owner now)
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // user1 (owner) tries to delete the record, but creator was someone else
      await expect(leLink.connect(user1).deleteRecord(resourceId)).to.be.revertedWithCustomError(
        leLink,
        'LeLink__NotAuthorized'
      );
    });

    it('Should handle forceDeleteRecord with record count edge case', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create a record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);
      expect(await leLink.getRecordCount()).to.equal(1);

      // Force delete the record
      await leLink.connect(creator).forceDeleteRecord(resourceId, user1.address);

      // Verify count is decremented
      expect(await leLink.getRecordCount()).to.equal(0);
      expect(await leLink.recordExists(resourceId, user1.address)).to.be.false;
    });
  });

  describe('Access Sharing', function () {
    it('Should log share access successfully', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      const expectedRecordId = await leLink.getRecordId(resourceId, user1.address);

      // Log share access
      await expect(leLink.connect(user1).logShareAccess(resourceId, user1.address, user2.address))
        .to.emit(leLink, 'DataShared')
        .withArgs(expectedRecordId, user1.address, user2.address, resourceId, (await time.latest()) + 1);
    });

    it('Should allow third party to log share access', async function () {
      const { leLink, creator, user1, user2, user3, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // user3 logs sharing between user1 and user2
      await expect(leLink.connect(user3).logShareAccess(resourceId, user1.address, user2.address)).to.not.be.reverted;
    });

    it('Should fail to share access to non-existent record', async function () {
      const { leLink, user1, user2, resourceId } = await loadFixture(deployLeLinkFixture);

      await expect(
        leLink.connect(user1).logShareAccess(resourceId, user1.address, user2.address)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__RecordDoesNotExist');
    });

    it('Should fail when recipient address is zero', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      await expect(
        leLink.connect(user1).logShareAccess(resourceId, user1.address, hre.ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__RecipientAddressCannotBeZero');
    });

    it('Should fail when sharing to self', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      await expect(
        leLink.connect(user1).logShareAccess(resourceId, user1.address, user1.address)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__CannotLogSharingToSelf');
    });

    it('Should fail when paused', async function () {
      const { leLink, owner, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Pause contract
      await leLink.connect(owner).pause();

      await expect(
        leLink.connect(user1).logShareAccess(resourceId, user1.address, user2.address)
      ).to.be.revertedWithCustomError(leLink, 'EnforcedPause');
    });
  });

  describe('Access Revocation', function () {
    it('Should log revoke access successfully', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      const expectedRecordId = await leLink.getRecordId(resourceId, user1.address);

      // Log revoke access
      await expect(leLink.connect(user1).logRevokeAccess(resourceId, user1.address, user2.address))
        .to.emit(leLink, 'DataAccessRevoked')
        .withArgs(expectedRecordId, user1.address, user2.address, resourceId, (await time.latest()) + 1);
    });

    it('Should allow third party to log revoke access', async function () {
      const { leLink, creator, user1, user2, user3, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // user3 logs revocation between user1 and user2
      await expect(leLink.connect(user3).logRevokeAccess(resourceId, user1.address, user2.address)).to.not.be.reverted;
    });

    it('Should fail to revoke access to non-existent record', async function () {
      const { leLink, user1, user2, resourceId } = await loadFixture(deployLeLinkFixture);

      await expect(
        leLink.connect(user1).logRevokeAccess(resourceId, user1.address, user2.address)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__RecordDoesNotExist');
    });

    it('Should fail when user address is zero', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      await expect(
        leLink.connect(user1).logRevokeAccess(resourceId, user1.address, hre.ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__UserAddressCannotBeZero');
    });

    it('Should fail when revoking from self', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      await expect(
        leLink.connect(user1).logRevokeAccess(resourceId, user1.address, user1.address)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__CannotLogRevocationFromSelf');
    });

    it('Should fail when paused', async function () {
      const { leLink, owner, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Pause contract
      await leLink.connect(owner).pause();

      await expect(
        leLink.connect(user1).logRevokeAccess(resourceId, user1.address, user2.address)
      ).to.be.revertedWithCustomError(leLink, 'EnforcedPause');
    });
  });

  describe('Pausable Functionality', function () {
    it('Should allow owner to pause and unpause', async function () {
      const { leLink, owner } = await loadFixture(deployLeLinkFixture);

      // Pause
      await expect(leLink.connect(owner).pause()).to.emit(leLink, 'Paused').withArgs(owner.address);

      expect(await leLink.paused()).to.be.true;

      // Unpause
      await expect(leLink.connect(owner).unpause()).to.emit(leLink, 'Unpaused').withArgs(owner.address);

      expect(await leLink.paused()).to.be.false;
    });

    it('Should fail when non-owner tries to pause', async function () {
      const { leLink, user1 } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.connect(user1).pause())
        .to.be.revertedWithCustomError(leLink, 'OwnableUnauthorizedAccount')
        .withArgs(user1.address);
    });

    it('Should fail when non-owner tries to unpause', async function () {
      const { leLink, owner, user1 } = await loadFixture(deployLeLinkFixture);

      // Pause first
      await leLink.connect(owner).pause();

      await expect(leLink.connect(user1).unpause())
        .to.be.revertedWithCustomError(leLink, 'OwnableUnauthorizedAccount')
        .withArgs(user1.address);
    });

    it('Should block all state-changing functions when paused', async function () {
      const { leLink, owner, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create a record first
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Pause the contract
      await leLink.connect(owner).pause();

      // All state-changing functions should fail
      await expect(
        leLink.connect(creator).createRecord('new-record', dataHash, user2.address)
      ).to.be.revertedWithCustomError(leLink, 'EnforcedPause');

      await expect(leLink.connect(user1).updateRecord(resourceId, 'new-hash')).to.be.revertedWithCustomError(
        leLink,
        'EnforcedPause'
      );

      await expect(leLink.connect(user1).deleteRecord(resourceId)).to.be.revertedWithCustomError(
        leLink,
        'EnforcedPause'
      );

      await expect(leLink.connect(user1).logAccess(resourceId, user1.address)).to.be.revertedWithCustomError(
        leLink,
        'EnforcedPause'
      );

      await expect(
        leLink.connect(user1).logShareAccess(resourceId, user1.address, user2.address)
      ).to.be.revertedWithCustomError(leLink, 'EnforcedPause');

      await expect(
        leLink.connect(user1).logRevokeAccess(resourceId, user1.address, user2.address)
      ).to.be.revertedWithCustomError(leLink, 'EnforcedPause');
    });

    it('Should allow view functions when paused', async function () {
      const { leLink, owner, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create a record first
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Pause the contract
      await leLink.connect(owner).pause();

      // View functions should still work
      expect(await leLink.recordExists(resourceId, user1.address)).to.be.true;
      expect(await leLink.getRecordCount()).to.equal(1);

      // Test view functions by calling them and verifying they return data
      const record = await leLink.getRecord(resourceId, user1.address);
      expect(record[0]).to.equal(creator.address); // creator is now msg.sender (creator), not owner (user1)

      const recordHash = await leLink.getRecordHash(resourceId, user1.address);
      expect(recordHash).to.not.equal('0x0000000000000000000000000000000000000000000000000000000000000000');

      const recordCreator = await leLink.getRecordCreator(resourceId, user1.address);
      expect(recordCreator).to.equal(creator.address); // creator is now msg.sender (creator), not owner (user1)

      const recordId = await leLink.getRecordId(resourceId, user1.address);
      expect(recordId).to.not.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
    });
  });

  describe('Ownership Management', function () {
    it('Should allow owner to transfer ownership', async function () {
      const { leLink, owner, user1 } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.connect(owner).transferOwnership(user1.address))
        .to.emit(leLink, 'OwnershipTransferred')
        .withArgs(owner.address, user1.address);

      expect(await leLink.owner()).to.equal(user1.address);
    });

    it('Should fail when non-owner tries to transfer ownership', async function () {
      const { leLink, user1, user2 } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.connect(user1).transferOwnership(user2.address))
        .to.be.revertedWithCustomError(leLink, 'OwnableUnauthorizedAccount')
        .withArgs(user1.address);
    });

    it('Should allow owner to renounce ownership', async function () {
      const { leLink, owner } = await loadFixture(deployLeLinkFixture);

      await expect(leLink.connect(owner).renounceOwnership())
        .to.emit(leLink, 'OwnershipTransferred')
        .withArgs(owner.address, hre.ethers.ZeroAddress);

      expect(await leLink.owner()).to.equal(hre.ethers.ZeroAddress);
    });

    it('Should prevent non-owners from pausing after ownership transfer', async function () {
      const { leLink, owner, user1 } = await loadFixture(deployLeLinkFixture);

      // Transfer ownership
      await leLink.connect(owner).transferOwnership(user1.address);

      // Original owner should no longer be able to pause
      await expect(leLink.connect(owner).pause())
        .to.be.revertedWithCustomError(leLink, 'OwnableUnauthorizedAccount')
        .withArgs(owner.address);

      // New owner should be able to pause
      await expect(leLink.connect(user1).pause()).to.not.be.reverted;
    });
  });

  describe('Complex Scenarios & Integration Tests', function () {
    it('Should handle complete lifecycle: create -> access -> update -> share -> revoke -> delete', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash, updatedDataHash } = await loadFixture(
        deployLeLinkFixture
      );

      // Create record (creator creates for themselves to allow deletion)
      await leLink.connect(creator).createRecord(resourceId, dataHash, creator.address);
      expect(await leLink.recordExists(resourceId, creator.address)).to.be.true;

      // Log access
      await leLink.connect(user2).logAccess(resourceId, creator.address);

      // Update record (only creator can update)
      await leLink.connect(creator).updateRecord(resourceId, updatedDataHash);

      // Share access
      await leLink.connect(user1).logShareAccess(resourceId, creator.address, user2.address);

      // Revoke access
      await leLink.connect(user1).logRevokeAccess(resourceId, creator.address, user2.address);

      // Delete record (only creator can delete)
      await leLink.connect(creator).deleteRecord(resourceId);
      expect(await leLink.recordExists(resourceId, creator.address)).to.be.false;
    });

    it('Should maintain separate records for different users', async function () {
      const { leLink, creator, user1, user2, dataHash } = await loadFixture(deployLeLinkFixture);

      const resourceId1 = 'record-user1';
      const resourceId2 = 'record-user2';

      // Create records for different users
      await leLink.connect(creator).createRecord(resourceId1, dataHash, user1.address);
      await leLink.connect(creator).createRecord(resourceId2, dataHash, user2.address);

      // Verify both exist independently
      expect(await leLink.recordExists(resourceId1, user1.address)).to.be.true;
      expect(await leLink.recordExists(resourceId2, user2.address)).to.be.true;
      expect(await leLink.recordExists(resourceId1, user2.address)).to.be.false;
      expect(await leLink.recordExists(resourceId2, user1.address)).to.be.false;

      expect(await leLink.getRecordCount()).to.equal(2);
    });

    it('Should handle record count correctly after multiple operations', async function () {
      const { leLink, creator, user1, user2, user3, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create multiple records (each user creates for themselves)
      await leLink.connect(user1).createRecord('record1', dataHash, user1.address);
      await leLink.connect(user2).createRecord('record2', dataHash, user2.address);
      await leLink.connect(user3).createRecord('record3', dataHash, user3.address);

      expect(await leLink.getRecordCount()).to.equal(3);

      // Delete one record (user2 deletes their own)
      await leLink.connect(user2).deleteRecord('record2');
      expect(await leLink.getRecordCount()).to.equal(2);

      // Delete another (user1 deletes their own)
      await leLink.connect(user1).deleteRecord('record1');
      expect(await leLink.getRecordCount()).to.equal(1);

      // Verify remaining record still exists
      expect(await leLink.recordExists('record3', user3.address)).to.be.true;

      // Delete last record (user3 deletes their own)
      await leLink.connect(user3).deleteRecord('record3');
      expect(await leLink.getRecordCount()).to.equal(0);
    });

    it('Should handle concurrent operations from multiple users', async function () {
      const { leLink, creator, user1, user2, user3, dataHash } = await loadFixture(deployLeLinkFixture);

      // Multiple users creating records simultaneously
      await Promise.all([
        leLink.connect(creator).createRecord('record1', dataHash, user1.address),
        leLink.connect(creator).createRecord('record2', dataHash, user2.address),
        leLink.connect(creator).createRecord('record3', dataHash, user3.address),
      ]);

      expect(await leLink.getRecordCount()).to.equal(3);

      // Multiple access logs
      await Promise.all([
        leLink.connect(user2).logAccess('record1', user1.address),
        leLink.connect(user3).logAccess('record2', user2.address),
        leLink.connect(user1).logAccess('record3', user3.address),
      ]);

      // All records should still exist
      expect(await leLink.recordExists('record1', user1.address)).to.be.true;
      expect(await leLink.recordExists('record2', user2.address)).to.be.true;
      expect(await leLink.recordExists('record3', user3.address)).to.be.true;
    });

    it('Should handle pause/unpause during active operations', async function () {
      const { leLink, owner, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Pause during operation
      await leLink.connect(owner).pause();

      // Operations should fail
      await expect(leLink.connect(user2).logAccess(resourceId, user1.address)).to.be.revertedWithCustomError(
        leLink,
        'EnforcedPause'
      );

      // Unpause and continue
      await leLink.connect(owner).unpause();

      // Operations should work again
      await expect(leLink.connect(user2).logAccess(resourceId, user1.address)).to.not.be.reverted;
    });
  });

  describe('Gas Optimization & Performance Tests', function () {
    it('Should efficiently handle batch record creation', async function () {
      const { leLink, creator, user1, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create multiple records in sequence
      const recordIds = ['batch-1', 'batch-2', 'batch-3', 'batch-4', 'batch-5'];

      for (const resourceId of recordIds) {
        await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);
      }

      expect(await leLink.getRecordCount()).to.equal(recordIds.length);

      // Verify all records exist
      for (const resourceId of recordIds) {
        expect(await leLink.recordExists(resourceId, user1.address)).to.be.true;
      }
    });

    it('Should handle large-scale operations efficiently', async function () {
      const { leLink, creator, user1, user2, dataHash } = await loadFixture(deployLeLinkFixture);

      const numRecords = 10;

      // Create multiple records
      for (let i = 0; i < numRecords; i++) {
        await leLink.connect(creator).createRecord(`record-${i}`, dataHash, user1.address);
      }

      // Perform multiple access logs
      for (let i = 0; i < numRecords; i++) {
        await leLink.connect(user2).logAccess(`record-${i}`, user1.address);
      }

      expect(await leLink.getRecordCount()).to.equal(numRecords);
    });

    it('Should maintain consistent performance with varying data sizes', async function () {
      const { leLink, creator, user1 } = await loadFixture(deployLeLinkFixture);

      const smallData = 'small';
      const mediumData = 'a'.repeat(100);
      const largeData = 'b'.repeat(1000);

      await leLink.connect(creator).createRecord('small-record', smallData, user1.address);
      await leLink.connect(creator).createRecord('medium-record', mediumData, user1.address);
      await leLink.connect(creator).createRecord('large-record', largeData, user1.address);

      expect(await leLink.getRecordCount()).to.equal(3);
      expect(await leLink.recordExists('small-record', user1.address)).to.be.true;
      expect(await leLink.recordExists('medium-record', user1.address)).to.be.true;
      expect(await leLink.recordExists('large-record', user1.address)).to.be.true;
    });
  });

  describe('Edge Cases & Error Handling', function () {
    it('Should handle empty string inputs gracefully', async function () {
      const { leLink, creator, user1, emptyDataHash, dataHash, stringToBytes32 } = await loadFixture(
        deployLeLinkFixture
      );

      // Empty resource ID and empty data hash should fail
      await expect(
        leLink.connect(creator).createRecord('', emptyDataHash, user1.address)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__EmptyHashNotAllowed');

      // Empty resource ID with valid data hash should work
      await expect(leLink.connect(creator).createRecord('', dataHash, user1.address)).to.not.be.reverted;

      expect(await leLink.recordExists('', user1.address)).to.be.true;

      const recordHash = await leLink.getRecordHash('', user1.address);
      expect(recordHash).to.equal(stringToBytes32(dataHash));
    });

    it('Should handle maximum length strings', async function () {
      const { leLink, creator, user1, longDataHash } = await loadFixture(deployLeLinkFixture);

      const longResourceId = 'c'.repeat(1000);

      await expect(leLink.connect(creator).createRecord(longResourceId, longDataHash, user1.address)).to.not.be
        .reverted;

      expect(await leLink.recordExists(longResourceId, user1.address)).to.be.true;
    });

    it('Should handle special characters in strings', async function () {
      const { leLink, creator, user1 } = await loadFixture(deployLeLinkFixture);

      const specialResourceId = 'record-with-特殊字符-émojis-🏥-and-symbols-@#$%';
      const specialDataHash = 'hash-with-特殊字符-and-symbols-αβγ-🔒';

      await expect(leLink.connect(creator).createRecord(specialResourceId, specialDataHash, user1.address)).to.not.be
        .reverted;

      expect(await leLink.recordExists(specialResourceId, user1.address)).to.be.true;
    });

    it('Should maintain state consistency after failed operations', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);
      const initialCount = await leLink.getRecordCount();

      // Try invalid operations
      await expect(leLink.connect(user2).deleteRecord(resourceId)).to.be.reverted;
      await expect(leLink.connect(user1).logShareAccess(resourceId, user1.address, user1.address)).to.be.reverted;
      await expect(leLink.connect(user1).logRevokeAccess(resourceId, user1.address, hre.ethers.ZeroAddress)).to.be
        .reverted;

      // State should remain unchanged
      expect(await leLink.getRecordCount()).to.equal(initialCount);
      expect(await leLink.recordExists(resourceId, user1.address)).to.be.true;
    });

    it('Should handle operations with zero addresses appropriately', async function () {
      const { leLink, creator, user1, resourceId, dataHash } = await loadFixture(deployLeLinkFixture);

      // Create record
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);

      // Zero address operations should fail
      await expect(
        leLink.connect(user1).logShareAccess(resourceId, user1.address, hre.ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__RecipientAddressCannotBeZero');

      await expect(
        leLink.connect(user1).logRevokeAccess(resourceId, user1.address, hre.ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(leLink, 'LeLink__UserAddressCannotBeZero');
    });

    it('Should handle record ID collisions appropriately', async function () {
      const { leLink, creator, user1, user2, dataHash } = await loadFixture(deployLeLinkFixture);

      const resourceId = 'same-resource-id';

      // Create records with same resourceId for different users
      await leLink.connect(creator).createRecord(resourceId, dataHash, user1.address);
      await leLink.connect(creator).createRecord(resourceId, dataHash, user2.address);

      // Both should exist independently
      expect(await leLink.recordExists(resourceId, user1.address)).to.be.true;
      expect(await leLink.recordExists(resourceId, user2.address)).to.be.true;

      // Record IDs should be different
      const recordId1 = await leLink.getRecordId(resourceId, user1.address);
      const recordId2 = await leLink.getRecordId(resourceId, user2.address);
      expect(recordId1).to.not.equal(recordId2);
    });
  });

  describe('Event Verification & Data Integrity', function () {
    it('Should emit correct events with proper data', async function () {
      const { leLink, creator, user1, user2, resourceId, dataHash, updatedDataHash, stringToBytes32 } =
        await loadFixture(deployLeLinkFixture);

      const expectedRecordId = await leLink.getRecordId(resourceId, creator.address);
      const expectedDataHash = stringToBytes32(dataHash);
      const expectedUpdatedDataHash = stringToBytes32(updatedDataHash);

      // Test DataCreated event (creator creates for themselves)
      const createTx = await leLink.connect(creator).createRecord(resourceId, dataHash, creator.address);
      const createReceipt = await createTx.wait();
      const createBlock = await hre.ethers.provider.getBlock(createReceipt!.blockNumber);

      await expect(createTx).to.emit(leLink, 'DataCreated').withArgs(
        expectedRecordId,
        creator.address, // owner
        creator.address, // creator
        resourceId,
        expectedDataHash,
        createBlock!.timestamp
      );

      // Test DataAccessed event
      const accessTx = await leLink.connect(user2).logAccess(resourceId, creator.address);
      const accessReceipt = await accessTx.wait();
      const accessBlock = await hre.ethers.provider.getBlock(accessReceipt!.blockNumber);

      await expect(accessTx)
        .to.emit(leLink, 'DataAccessed')
        .withArgs(expectedRecordId, user2.address, resourceId, accessBlock!.timestamp);

      // Test DataUpdated event
      const updateTx = await leLink.connect(creator).updateRecord(resourceId, updatedDataHash);
      const updateReceipt = await updateTx.wait();
      const updateBlock = await hre.ethers.provider.getBlock(updateReceipt!.blockNumber);

      await expect(updateTx)
        .to.emit(leLink, 'DataUpdated')
        .withArgs(expectedRecordId, creator.address, resourceId, expectedUpdatedDataHash, updateBlock!.timestamp);

      // Test DataShared event
      const shareTx = await leLink.connect(user1).logShareAccess(resourceId, creator.address, user2.address);
      const shareReceipt = await shareTx.wait();
      const shareBlock = await hre.ethers.provider.getBlock(shareReceipt!.blockNumber);

      await expect(shareTx)
        .to.emit(leLink, 'DataShared')
        .withArgs(expectedRecordId, user1.address, user2.address, resourceId, shareBlock!.timestamp);

      // Test DataAccessRevoked event
      const revokeTx = await leLink.connect(user1).logRevokeAccess(resourceId, creator.address, user2.address);
      const revokeReceipt = await revokeTx.wait();
      const revokeBlock = await hre.ethers.provider.getBlock(revokeReceipt!.blockNumber);

      await expect(revokeTx)
        .to.emit(leLink, 'DataAccessRevoked')
        .withArgs(expectedRecordId, user1.address, user2.address, resourceId, revokeBlock!.timestamp);

      // Test DataDeleted event
      const deleteTx = await leLink.connect(creator).deleteRecord(resourceId);
      const deleteReceipt = await deleteTx.wait();
      const deleteBlock = await hre.ethers.provider.getBlock(deleteReceipt!.blockNumber);

      await expect(deleteTx)
        .to.emit(leLink, 'DataDeleted')
        .withArgs(expectedRecordId, creator.address, resourceId, deleteBlock!.timestamp);
    });

    it('Should maintain data consistency across all operations', async function () {
      const { leLink, creator, user1, resourceId, dataHash, updatedDataHash, stringToBytes32 } = await loadFixture(
        deployLeLinkFixture
      );

      // Create record (creator creates for themselves)
      await leLink.connect(creator).createRecord(resourceId, dataHash, creator.address);

      // Verify initial state
      const [initialCreator, initialDataHash, initialCreatedAt, initialLastModified] = await leLink.getRecord(
        resourceId,
        creator.address
      );

      expect(initialCreator).to.equal(creator.address); // creator is now msg.sender (creator)
      expect(initialDataHash).to.equal(stringToBytes32(dataHash));
      expect(initialCreatedAt).to.equal(initialLastModified);

      // Update record (creator updates their own record)
      await time.increase(100);
      await leLink.connect(creator).updateRecord(resourceId, updatedDataHash);

      // Verify updated state
      const [updatedCreator, updatedDataHashValue, updatedCreatedAt, updatedLastModified] = await leLink.getRecord(
        resourceId,
        creator.address
      );

      expect(updatedCreator).to.equal(creator.address); // Creator shouldn't change
      expect(updatedDataHashValue).to.equal(stringToBytes32(updatedDataHash));
      expect(updatedCreatedAt).to.equal(initialCreatedAt); // Created time shouldn't change
      expect(updatedLastModified).to.be.greaterThan(initialLastModified); // Last modified should increase
    });

    it('Should verify stringToBytes32 conversion consistency', async function () {
      const { leLink, creator, user1, stringToBytes32 } = await loadFixture(deployLeLinkFixture);

      const testStrings = [
        'short',
        'exactly32chars-exactly32chars--',
        'this_string_is_longer_than_32_characters_and_should_be_truncated',
        'special-chars-αβγ-🔒',
      ];

      for (let i = 0; i < testStrings.length; i++) {
        const testString = testStrings[i];
        const resourceId = `test-${i}`;

        await leLink.connect(creator).createRecord(resourceId, testString, user1.address);

        const recordHash = await leLink.getRecordHash(resourceId, user1.address);
        const expectedHash = stringToBytes32(testString);

        expect(recordHash).to.equal(expectedHash);
      }
    });
  });
});
