#!/usr/bin/env node

/**
 * Test blockchain integration for FHIR resource logging
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load config manually
const configPath = join(__dirname, '../../local.settings.json');
const localSettings = JSON.parse(readFileSync(configPath, 'utf8'));
const settings = localSettings.Values;

// Set environment variables
Object.assign(process.env, settings);

import { blockchainService } from '../services/blockchain.js';
import { Logger } from '../utils/logger.js';

async function testBlockchain() {
  const logger = new Logger();
  
  console.log('=== Testing Blockchain Integration ===');
  
  try {
    // Check blockchain service status
    const status = blockchainService.getStatus();
    console.log('Blockchain service status:', status);
    
    if (!status.enabled) {
      console.log('⚠️  Blockchain service is disabled');
      return;
    }
    
    // Create test FHIR resources
    const testResources = [
      {
        resourceType: 'Observation',
        id: 'test-obs-' + Date.now(),
        status: 'final',
        subject: { reference: 'Patient/test-patient-123' },
        valueString: 'Chest pain',
        meta: {
          lastUpdated: new Date().toISOString(),
          source: 'LeLink-Test'
        }
      },
      {
        resourceType: 'RiskAssessment',
        id: 'test-risk-' + Date.now(),
        status: 'final',
        subject: { reference: 'Patient/test-patient-123' },
        prediction: [{
          outcome: { text: 'Low cardiac risk' },
          probabilityDecimal: 0.2
        }],
        meta: {
          lastUpdated: new Date().toISOString(),
          source: 'LeLink-Test'
        }
      }
    ];
    
    console.log(`\\n📋 Testing with ${testResources.length} FHIR resources`);
    
    // Log resources to blockchain
    const result = await blockchainService.logResources(testResources, 'test-patient-123');
    
    if (result && result.success) {
      console.log('\\n✅ Blockchain logging successful!');
      console.log('Network:', result.network);
      console.log('Contract Address:', result.contractAddress);
      console.log('Resources logged:', result.results.length);
      
      for (const logResult of result.results) {
        console.log(`  - ${logResult.resourceId}`);
        console.log(`    Hash: ${logResult.dataHash.substring(0, 16)}...`);
        console.log(`    TX: ${logResult.transactionHash}`);
        console.log(`    Block: ${logResult.blockNumber}`);
      }
    } else {
      console.log('❌ Blockchain logging failed');
      if (result) {
        console.log('Error result:', result);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
  }
}

testBlockchain().catch(console.error);