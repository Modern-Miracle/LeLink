#!/usr/bin/env node

/**
 * Test the new patient-centric FHIR storage structure
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load config manually
const configPath = join(__dirname, '../../local.settings.json');
const localSettings = JSON.parse(readFileSync(configPath, 'utf8'));
const settings = localSettings.Values;

// Set environment variables
Object.assign(process.env, settings);

import { fhirStorageService } from '../services/fhirStorage.js';
import { Logger } from '../utils/logger.js';

async function testFHIRStorageStructure() {
  const logger = new Logger();
  
  console.log('=== Testing FHIR Storage Structure ===');
  
  try {
    // Initialize storage service
    await fhirStorageService.initialize();
    
    console.log('Storage Status:', fhirStorageService.getStatus());
    
    // Create test patient resources for patient-001
    const patient001Resources = [
      {
        resourceType: 'Patient',
        id: 'patient-001',
        name: [{ given: ['John'], family: 'Doe' }],
        identifier: [
          {
            system: 'http://lelink.local/patient-id',
            value: 'patient-001'
          }
        ],
        meta: {
          lastUpdated: new Date().toISOString(),
          source: 'LeLink-Test'
        }
      },
      {
        resourceType: 'Observation',
        id: 'obs-001',
        status: 'final',
        subject: { 
          reference: 'Patient/patient-001',
          display: 'John Doe'
        },
        valueString: 'Chest pain',
        identifier: [
          {
            system: 'http://lelink.local/patient-id',
            value: 'patient-001'
          }
        ],
        meta: {
          lastUpdated: new Date().toISOString(),
          source: 'LeLink-Test'
        }
      },
      {
        resourceType: 'RiskAssessment',
        id: 'risk-001',
        status: 'final',
        subject: { 
          reference: 'Patient/patient-001',
          display: 'John Doe'
        },
        prediction: [{
          outcome: { text: 'Low cardiac risk' },
          probabilityDecimal: 0.2
        }],
        identifier: [
          {
            system: 'http://lelink.local/patient-id',
            value: 'patient-001'
          }
        ],
        meta: {
          lastUpdated: new Date().toISOString(),
          source: 'LeLink-Test'
        }
      }
    ];

    // Create test resources for patient-002
    const patient002Resources = [
      {
        resourceType: 'Patient',
        id: 'patient-002',
        name: [{ given: ['Jane'], family: 'Smith' }],
        identifier: [
          {
            system: 'http://lelink.local/patient-id',
            value: 'patient-002'
          }
        ],
        meta: {
          lastUpdated: new Date().toISOString(),
          source: 'LeLink-Test'
        }
      },
      {
        resourceType: 'Observation',
        id: 'obs-010',
        status: 'final',
        subject: { 
          reference: 'Patient/patient-002',
          display: 'Jane Smith'
        },
        valueString: 'Headache',
        identifier: [
          {
            system: 'http://lelink.local/patient-id',
            value: 'patient-002'
          }
        ],
        meta: {
          lastUpdated: new Date().toISOString(),
          source: 'LeLink-Test'
        }
      }
    ];

    console.log('\\n📦 Storing resources for patient-001...');
    for (const resource of patient001Resources) {
      const result = await fhirStorageService.storeResource(resource);
      if (result.success) {
        console.log(`  ✅ Stored ${resource.resourceType}/${resource.id} at ${result.blobName}`);
      } else {
        console.log(`  ❌ Failed to store ${resource.resourceType}/${resource.id}: ${result.error}`);
      }
    }

    console.log('\\n📦 Storing resources for patient-002...');
    for (const resource of patient002Resources) {
      const result = await fhirStorageService.storeResource(resource);
      if (result.success) {
        console.log(`  ✅ Stored ${resource.resourceType}/${resource.id} at ${result.blobName}`);
      } else {
        console.log(`  ❌ Failed to store ${resource.resourceType}/${resource.id}: ${result.error}`);
      }
    }

    // Test retrieval
    console.log('\\n🔍 Testing resource retrieval...');
    
    // Get specific resource
    const retrievedPatient = await fhirStorageService.getResource('patient-001', 'Patient', 'patient-001');
    if (retrievedPatient) {
      console.log(`  ✅ Retrieved Patient/patient-001: ${retrievedPatient.name?.[0]?.given?.[0]} ${retrievedPatient.name?.[0]?.family}`);
    } else {
      console.log('  ❌ Failed to retrieve Patient/patient-001');
    }

    // List all resources for patient-001
    console.log('\\n📋 Listing all resources for patient-001...');
    const patient001AllResources = await fhirStorageService.listPatientResources('patient-001');
    console.log(`  Found ${patient001AllResources.length} resources:`);
    for (const resource of patient001AllResources) {
      console.log(`    - ${resource.resourceType}/${resource.id}`);
    }

    // List all resources for patient-002
    console.log('\\n📋 Listing all resources for patient-002...');
    const patient002AllResources = await fhirStorageService.listPatientResources('patient-002');
    console.log(`  Found ${patient002AllResources.length} resources:`);
    for (const resource of patient002AllResources) {
      console.log(`    - ${resource.resourceType}/${resource.id}`);
    }

    // Search by resource type
    console.log('\\n🔎 Searching all Observation resources...');
    const allObservations = await fhirStorageService.searchResourcesByType('Observation');
    console.log(`  Found ${allObservations.length} Observation resources across all patients:`);
    for (const obs of allObservations) {
      console.log(`    - ${obs.id} (Patient: ${obs.subject?.reference || 'unknown'})`);
    }

    console.log('\\n✅ FHIR Storage Structure Test Completed Successfully!');
    console.log('\\n📁 Expected Storage Structure:');
    console.log('├── patient-001/');
    console.log('│   ├── Patient/');
    console.log('│   │   └── patient-001.json');
    console.log('│   ├── Observation/');
    console.log('│   │   └── obs-001.json');
    console.log('│   └── RiskAssessment/');
    console.log('│       └── risk-001.json');
    console.log('├── patient-002/');
    console.log('│   ├── Patient/');
    console.log('│   │   └── patient-002.json');
    console.log('│   └── Observation/');
    console.log('│       └── obs-010.json');

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

testFHIRStorageStructure().catch(console.error);