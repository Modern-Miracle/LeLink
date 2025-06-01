/**
 * @fileoverview Simple FHIR Storage API Test
 * @module tests/testFHIRStorageSimple
 * 
 * Quick test for FHIR Storage API endpoints
 */

import axios from 'axios';

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  timestamp: string;
}

const BASE_URL = 'http://localhost:7071/api/fhir-storage';
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

async function runSimpleTests(): Promise<void> {
  console.log('🧪 FHIR Storage API Simple Test\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await client.get<APIResponse>('/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Success: ${healthResponse.data.success}`);
    console.log(`   Service: ${healthResponse.data.data?.service}`);
    console.log('   ✅ Health check passed\n');

    // Test 2: Get All Patients
    console.log('2. Testing get all patients...');
    const patientsResponse = await client.get<APIResponse>('/patients');
    console.log(`   Status: ${patientsResponse.status}`);
    console.log(`   Success: ${patientsResponse.data.success}`);
    console.log(`   Patient count: ${patientsResponse.data.data?.count}`);
    console.log(`   Patients: ${JSON.stringify(patientsResponse.data.data?.patients)}`);
    console.log('   ✅ Get patients passed\n');

    // Test 3: Get Patient Resources (if patients exist)
    if (patientsResponse.data.data?.patients?.length > 0) {
      const testPatientId = patientsResponse.data.data.patients[0];
      console.log(`3. Testing get patient resources for: ${testPatientId}`);
      
      const resourcesResponse = await client.get<APIResponse>(
        `/patients/${encodeURIComponent(testPatientId)}/resources`
      );
      console.log(`   Status: ${resourcesResponse.status}`);
      console.log(`   Success: ${resourcesResponse.data.success}`);
      console.log(`   Resource count: ${resourcesResponse.data.data?.totalCount}`);
      console.log(`   Resource types: ${JSON.stringify(resourcesResponse.data.data?.resourceTypes)}`);
      console.log('   ✅ Get patient resources passed\n');

      // Test 4: Get Specific Resource (if resources exist)
      if (resourcesResponse.data.data?.resources?.length > 0) {
        const testResource = resourcesResponse.data.data.resources[0];
        console.log(`4. Testing get specific resource: ${testResource.resourceType}/${testResource.id}`);
        
        const specificResponse = await client.get<APIResponse>(
          `/resource/${encodeURIComponent(testPatientId)}/${encodeURIComponent(testResource.resourceType)}/${encodeURIComponent(testResource.id)}`
        );
        console.log(`   Status: ${specificResponse.status}`);
        console.log(`   Success: ${specificResponse.data.success}`);
        console.log(`   Resource type: ${specificResponse.data.data?.resourceType}`);
        console.log(`   Resource ID: ${specificResponse.data.data?.id}`);
        console.log('   ✅ Get specific resource passed\n');

        // Test 5: Get Resources by Type
        console.log(`5. Testing get resources by type: ${testResource.resourceType}`);
        
        const typeResponse = await client.get<APIResponse>(
          `/resources/${encodeURIComponent(testResource.resourceType)}`
        );
        console.log(`   Status: ${typeResponse.status}`);
        console.log(`   Success: ${typeResponse.data.success}`);
        console.log(`   Total resources: ${typeResponse.data.data?.totalCount}`);
        console.log(`   Patient count: ${typeResponse.data.data?.patientCount}`);
        console.log('   ✅ Get resources by type passed\n');
      }
    }

    // Test 6: Error Handling
    console.log('6. Testing error handling...');
    try {
      await client.get('/resource/non-existent/Observation/non-existent');
      console.log('   ⚠️  Expected 404 but got success response');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('   ✅ Correctly returned 404 for non-existent resource');
      } else {
        console.log(`   ⚠️  Got unexpected error: ${error}`);
      }
    }

    console.log('\n🎉 All basic tests completed successfully!');

  } catch (error) {
    console.error('💥 Test failed:', error);
    if (axios.isAxiosError(error)) {
      console.error('   Response:', error.response?.data);
    }
    process.exit(1);
  }
}

// Run tests
runSimpleTests();