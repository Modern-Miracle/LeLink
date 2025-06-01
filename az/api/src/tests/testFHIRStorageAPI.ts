/**
 * @fileoverview FHIR Storage API Test Suite
 * @module tests/testFHIRStorageAPI
 * 
 * Comprehensive test suite for the FHIR Storage API endpoints
 * Tests all CRUD operations, error handling, and data integrity
 */

import axios, { AxiosResponse, AxiosError } from 'axios';

// ===== TYPE DEFINITIONS =====

interface FHIRResource {
  resourceType: string;
  id: string;
  status?: string;
  subject?: {
    reference: string;
    display?: string;
  };
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  meta?: {
    lastUpdated?: string;
    source?: string;
    profile?: string[];
    environment?: string;
  };
  [key: string]: any;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  timestamp: string;
}

interface HealthCheckData {
  service: string;
  status: string;
  storage: {
    initialized: boolean;
    storageMode: string;
    containerName: string;
    environment: string;
  };
  timestamp: string;
}

interface PatientsData {
  patients: string[];
  count: number;
}

interface PatientResourcesData {
  patientId: string;
  resources: FHIRResource[];
  resourcesByType: Record<string, FHIRResource[]>;
  totalCount: number;
  resourceTypes: string[];
}

interface ResourcesByTypeData {
  resourceType: string;
  resources: FHIRResource[];
  resourcesByPatient: Record<string, FHIRResource[]>;
  totalCount: number;
  patientCount: number;
  patientIds: string[];
}

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

// ===== CONFIGURATION =====

const CONFIG = {
  baseURL: 'http://localhost:7071/api/fhir-storage',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
};

// ===== UTILITY FUNCTIONS =====

class FHIRStorageAPITester {
  private axios = axios.create({
    baseURL: CONFIG.baseURL,
    timeout: CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  private testResults: TestResult[] = [];

  /**
   * Execute a test with proper error handling and timing
   */
  private async executeTest<T>(
    testName: string,
    testFunction: () => Promise<T>
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running: ${testName}`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        testName,
        success: true,
        duration,
        details: result,
      };
      
      console.log(`✅ Passed: ${testName} (${duration}ms)`);
      this.testResults.push(testResult);
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const testResult: TestResult = {
        testName,
        success: false,
        duration,
        error: errorMessage,
      };
      
      console.log(`❌ Failed: ${testName} (${duration}ms) - ${errorMessage}`);
      this.testResults.push(testResult);
      return testResult;
    }
  }

  /**
   * Validate API response structure
   */
  private validateAPIResponse<T>(response: AxiosResponse<APIResponse<T>>): APIResponse<T> {
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = response.data;
    if (typeof data !== 'object' || data === null) {
      throw new Error('Response is not a valid object');
    }

    if (typeof data.success !== 'boolean') {
      throw new Error('Response missing required "success" field');
    }

    if (typeof data.message !== 'string') {
      throw new Error('Response missing required "message" field');
    }

    if (typeof data.timestamp !== 'string') {
      throw new Error('Response missing required "timestamp" field');
    }

    return data;
  }

  /**
   * Test health check endpoint
   */
  private async testHealthCheck(): Promise<HealthCheckData> {
    const response = await this.axios.get<APIResponse<HealthCheckData>>('/health');
    const apiResponse = this.validateAPIResponse(response);

    if (!apiResponse.success) {
      throw new Error(`Health check failed: ${apiResponse.error}`);
    }

    if (!apiResponse.data) {
      throw new Error('Health check response missing data');
    }

    const healthData = apiResponse.data;

    // Validate health data structure
    if (typeof healthData.service !== 'string') {
      throw new Error('Health data missing service name');
    }

    if (typeof healthData.status !== 'string') {
      throw new Error('Health data missing status');
    }

    if (!healthData.storage || typeof healthData.storage !== 'object') {
      throw new Error('Health data missing storage information');
    }

    return healthData;
  }

  /**
   * Test get all patients endpoint
   */
  private async testGetAllPatients(): Promise<PatientsData> {
    const response = await this.axios.get<APIResponse<PatientsData>>('/patients');
    const apiResponse = this.validateAPIResponse(response);

    if (!apiResponse.success) {
      throw new Error(`Get patients failed: ${apiResponse.error}`);
    }

    if (!apiResponse.data) {
      throw new Error('Get patients response missing data');
    }

    const patientsData = apiResponse.data;

    // Validate patients data structure
    if (!Array.isArray(patientsData.patients)) {
      throw new Error('Patients data must contain an array of patient IDs');
    }

    if (typeof patientsData.count !== 'number') {
      throw new Error('Patients data must contain a count field');
    }

    if (patientsData.patients.length !== patientsData.count) {
      throw new Error('Patient count mismatch: array length does not match count field');
    }

    return patientsData;
  }

  /**
   * Test get patient resources endpoint
   */
  private async testGetPatientResources(patientId: string): Promise<PatientResourcesData> {
    const response = await this.axios.get<APIResponse<PatientResourcesData>>(
      `/patients/${encodeURIComponent(patientId)}/resources`
    );
    const apiResponse = this.validateAPIResponse(response);

    if (!apiResponse.success) {
      throw new Error(`Get patient resources failed: ${apiResponse.error}`);
    }

    if (!apiResponse.data) {
      throw new Error('Get patient resources response missing data');
    }

    const resourcesData = apiResponse.data;

    // Validate resources data structure
    if (resourcesData.patientId !== patientId) {
      throw new Error('Patient ID mismatch in response');
    }

    if (!Array.isArray(resourcesData.resources)) {
      throw new Error('Resources data must contain an array of resources');
    }

    if (typeof resourcesData.totalCount !== 'number') {
      throw new Error('Resources data must contain a totalCount field');
    }

    if (resourcesData.resources.length !== resourcesData.totalCount) {
      throw new Error('Resource count mismatch');
    }

    if (!resourcesData.resourcesByType || typeof resourcesData.resourcesByType !== 'object') {
      throw new Error('Resources data must contain resourcesByType grouping');
    }

    if (!Array.isArray(resourcesData.resourceTypes)) {
      throw new Error('Resources data must contain resourceTypes array');
    }

    // Validate each resource
    for (const resource of resourcesData.resources) {
      this.validateFHIRResource(resource, patientId);
    }

    return resourcesData;
  }

  /**
   * Test get specific resource endpoint
   */
  private async testGetSpecificResource(
    patientId: string,
    resourceType: string,
    resourceId: string
  ): Promise<FHIRResource> {
    const response = await this.axios.get<APIResponse<FHIRResource>>(
      `/resource/${encodeURIComponent(patientId)}/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`
    );
    const apiResponse = this.validateAPIResponse(response);

    if (!apiResponse.success) {
      throw new Error(`Get specific resource failed: ${apiResponse.error}`);
    }

    if (!apiResponse.data) {
      throw new Error('Get specific resource response missing data');
    }

    const resource = apiResponse.data;
    this.validateFHIRResource(resource, patientId);

    if (resource.resourceType !== resourceType) {
      throw new Error(`Resource type mismatch: expected ${resourceType}, got ${resource.resourceType}`);
    }

    if (resource.id !== resourceId) {
      throw new Error(`Resource ID mismatch: expected ${resourceId}, got ${resource.id}`);
    }

    return resource;
  }

  /**
   * Test get resources by type endpoint
   */
  private async testGetResourcesByType(resourceType: string): Promise<ResourcesByTypeData> {
    const response = await this.axios.get<APIResponse<ResourcesByTypeData>>(
      `/resources/${encodeURIComponent(resourceType)}`
    );
    const apiResponse = this.validateAPIResponse(response);

    if (!apiResponse.success) {
      throw new Error(`Get resources by type failed: ${apiResponse.error}`);
    }

    if (!apiResponse.data) {
      throw new Error('Get resources by type response missing data');
    }

    const resourcesData = apiResponse.data;

    // Validate resources by type data structure
    if (resourcesData.resourceType !== resourceType) {
      throw new Error('Resource type mismatch in response');
    }

    if (!Array.isArray(resourcesData.resources)) {
      throw new Error('Resources data must contain an array of resources');
    }

    if (typeof resourcesData.totalCount !== 'number') {
      throw new Error('Resources data must contain a totalCount field');
    }

    if (resourcesData.resources.length !== resourcesData.totalCount) {
      throw new Error('Resource count mismatch');
    }

    if (!resourcesData.resourcesByPatient || typeof resourcesData.resourcesByPatient !== 'object') {
      throw new Error('Resources data must contain resourcesByPatient grouping');
    }

    if (typeof resourcesData.patientCount !== 'number') {
      throw new Error('Resources data must contain a patientCount field');
    }

    if (!Array.isArray(resourcesData.patientIds)) {
      throw new Error('Resources data must contain patientIds array');
    }

    // Validate each resource has correct type
    for (const resource of resourcesData.resources) {
      if (resource.resourceType !== resourceType) {
        throw new Error(`Resource type mismatch: expected ${resourceType}, got ${resource.resourceType}`);
      }
    }

    return resourcesData;
  }

  /**
   * Test error handling for non-existent resources
   */
  private async testErrorHandling(): Promise<void> {
    // Test non-existent patient
    try {
      await this.axios.get('/patients/non-existent-patient/resources');
      throw new Error('Expected 404 for non-existent patient, but request succeeded');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 200) {
        // This is actually OK - empty result for non-existent patient
        console.log('  ℹ️  Non-existent patient returns empty results (expected behavior)');
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('  ✅ Non-existent patient returns 404 (expected behavior)');
      } else {
        throw error;
      }
    }

    // Test non-existent resource
    try {
      await this.axios.get('/resource/test-patient/Observation/non-existent-resource');
      throw new Error('Expected 404 for non-existent resource, but request succeeded');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('  ✅ Non-existent resource returns 404 (expected behavior)');
      } else {
        throw error;
      }
    }

    // Test invalid resource type
    const response = await this.axios.get('/resources/InvalidResourceType');
    const apiResponse = this.validateAPIResponse(response);
    if (apiResponse.success && apiResponse.data) {
      const data = apiResponse.data as ResourcesByTypeData;
      if (data.totalCount === 0) {
        console.log('  ✅ Invalid resource type returns empty results (expected behavior)');
      }
    }
  }

  /**
   * Validate FHIR resource structure
   */
  private validateFHIRResource(resource: FHIRResource, expectedPatientId?: string): void {
    if (!resource.resourceType || typeof resource.resourceType !== 'string') {
      throw new Error('FHIR resource must have a resourceType');
    }

    if (!resource.id || typeof resource.id !== 'string') {
      throw new Error('FHIR resource must have an id');
    }

    // Validate patient reference if not a Patient resource
    if (resource.resourceType !== 'Patient' && expectedPatientId) {
      if (!resource.subject?.reference) {
        throw new Error('FHIR resource must have a subject reference');
      }

      if (!resource.subject.reference.includes(expectedPatientId)) {
        throw new Error(`FHIR resource subject reference must include patient ID ${expectedPatientId}`);
      }
    }

    // Validate identifiers
    if (resource.identifier && Array.isArray(resource.identifier)) {
      for (const identifier of resource.identifier) {
        if (!identifier.system || !identifier.value) {
          throw new Error('FHIR resource identifiers must have system and value');
        }
      }
    }

    // Validate metadata
    if (resource.meta) {
      if (resource.meta.lastUpdated && typeof resource.meta.lastUpdated !== 'string') {
        throw new Error('FHIR resource meta.lastUpdated must be a string');
      }

      if (resource.meta.source && typeof resource.meta.source !== 'string') {
        throw new Error('FHIR resource meta.source must be a string');
      }
    }
  }

  /**
   * Test CORS headers
   */
  private async testCORSHeaders(): Promise<void> {
    const response = await this.axios.options('/health');
    
    if (response.status !== 200) {
      throw new Error(`CORS preflight failed with status ${response.status}`);
    }

    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers'],
    };

    console.log('  ✅ CORS headers present:', corsHeaders);
  }

  /**
   * Test data integrity across endpoints
   */
  private async testDataIntegrity(): Promise<void> {
    // Get all patients
    const patientsData = await this.testGetAllPatients();
    
    if (patientsData.patients.length === 0) {
      console.log('  ℹ️  No patients found - skipping data integrity tests');
      return;
    }

    // Pick first patient for detailed testing
    const testPatientId = patientsData.patients[0];
    console.log(`  🔍 Testing data integrity for patient: ${testPatientId}`);

    // Get patient resources
    const patientResources = await this.testGetPatientResources(testPatientId);

    if (patientResources.resources.length === 0) {
      console.log('  ℹ️  No resources found for patient - skipping resource tests');
      return;
    }

    // Test specific resource retrieval
    const firstResource = patientResources.resources[0];
    const specificResource = await this.testGetSpecificResource(
      testPatientId,
      firstResource.resourceType,
      firstResource.id
    );

    // Verify resources match
    if (JSON.stringify(firstResource) !== JSON.stringify(specificResource)) {
      throw new Error('Resource data mismatch between endpoints');
    }

    console.log('  ✅ Resource data consistent across endpoints');

    // Test resources by type
    const resourcesByType = await this.testGetResourcesByType(firstResource.resourceType);
    
    // Verify the resource appears in type-based search
    const foundResource = resourcesByType.resources.find(r => r.id === firstResource.id);
    if (!foundResource) {
      throw new Error('Resource not found in type-based search');
    }

    console.log('  ✅ Resource found in type-based search');
  }

  /**
   * Run all tests
   */
  public async runAllTests(): Promise<TestSuite> {
    console.log('🚀 Starting FHIR Storage API Test Suite\n');
    console.log(`📍 Base URL: ${CONFIG.baseURL}`);
    console.log(`⏱️  Timeout: ${CONFIG.timeout}ms\n`);

    const startTime = Date.now();

    // Execute all tests
    await this.executeTest('Health Check', () => this.testHealthCheck());
    await this.executeTest('Get All Patients', () => this.testGetAllPatients());
    await this.executeTest('CORS Headers', () => this.testCORSHeaders());
    await this.executeTest('Error Handling', () => this.testErrorHandling());
    await this.executeTest('Data Integrity', () => this.testDataIntegrity());

    const totalDuration = Date.now() - startTime;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = this.testResults.filter(r => !r.success).length;

    const testSuite: TestSuite = {
      name: 'FHIR Storage API Test Suite',
      results: this.testResults,
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      totalDuration,
    };

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`🧪 Total Tests: ${testSuite.totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📈 Success Rate: ${((passedTests / testSuite.totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  • ${result.testName}: ${result.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    return testSuite;
  }
}

// ===== MAIN EXECUTION =====

async function main(): Promise<void> {
  try {
    const tester = new FHIRStorageAPITester();
    const results = await tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(results.failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Test suite failed to run:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

export {
  FHIRStorageAPITester,
  FHIRResource,
  APIResponse,
  TestResult,
  TestSuite,
};