const { DefaultAzureCredential } = require('@azure/identity');
const axios = require('axios');
const { Logger } = require('../utils/logger');
const config = require('../utils/config');

const logger = new Logger({ context: 'FHIRStorageService' });

class FHIRStorageService {
  constructor() {
    this.initialized = false;
    this.storageMode = null;
    this.fhirServerUrl = null;
    this.fhirServerHeaders = {};
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Always use FHIR Service (Azure FHIR Service)
      this.storageMode = 'fhir-service';

      // Use Azure FHIR Service
      this.fhirServerUrl = process.env.FHIR_SERVER_URL;
      
      if (!this.fhirServerUrl) {
        throw new Error('FHIR_SERVER_URL environment variable is required');
      }

      // Use DefaultAzureCredential (handles service principal in dev, managed identity in prod)
      await this.setupDefaultCredentialAuth();

      // Test connection
      try {
        const response = await axios.get(`${this.fhirServerUrl}/metadata`, {
          headers: this.fhirServerHeaders,
          timeout: 5000
        });
        
        logger.info('FHIR Service connection verified', {
          serverUrl: this.fhirServerUrl,
          version: response.data.fhirVersion,
          authType: 'DefaultAzureCredential'
        });
      } catch (error) {
        logger.warn('FHIR Service connection test failed', { 
          error: error.message,
          serverUrl: this.fhirServerUrl,
          authType: 'DefaultAzureCredential'
        });
        // Don't throw - allow initialization to continue
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize FHIR storage', error);
      throw error;
    }
  }

  /**
   * Set up authentication using DefaultAzureCredential
   * (handles service principal in dev, managed identity in prod, az login, etc.)
   */
  async setupDefaultCredentialAuth() {
    try {
      const credential = new DefaultAzureCredential();
      
      // Get access token for Azure Health Data Services
      const tokenResponse = await credential.getToken('https://azurehealthcareapis.com/.default');
      
      if (tokenResponse && tokenResponse.token) {
        this.fhirServerHeaders.Authorization = `Bearer ${tokenResponse.token}`;
        
        // Set up token refresh
        this.credential = credential;
        this.tokenScope = 'https://azurehealthcareapis.com/.default';
        
        logger.info('DefaultAzureCredential authentication configured successfully');
      } else {
        throw new Error('Failed to obtain access token');
      }
    } catch (error) {
      logger.error('Failed to set up DefaultAzureCredential authentication', error);
      throw new Error(`DefaultAzureCredential setup failed: ${error.message}`);
    }
  }


  /**
   * Refresh authentication token if needed
   */
  async refreshAuthIfNeeded() {
    // DefaultAzureCredential handles token refresh automatically
    if (this.credential && this.tokenScope) {
      try {
        const tokenResponse = await this.credential.getToken(this.tokenScope);
        if (tokenResponse && tokenResponse.token) {
          this.fhirServerHeaders.Authorization = `Bearer ${tokenResponse.token}`;
        }
      } catch (error) {
        logger.warn('Failed to refresh DefaultAzureCredential token', error);
      }
    }
  }

  /**
   * Store a FHIR resource
   * @param {Object} resource - FHIR resource to store
   * @returns {Object} Storage result with location/id
   */
  async storeResource(resource) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const resourceType = resource.resourceType;
      const resourceId = resource.id;

      // Refresh auth if needed before making request
      await this.refreshAuthIfNeeded();
      
      // Store in FHIR Service
      const url = `${this.fhirServerUrl}/${resourceType}/${resourceId}`;
      
      const response = await axios.put(url, resource, {
        headers: {
          ...this.fhirServerHeaders,
          'Content-Type': 'application/fhir+json',
          'Prefer': 'return=representation'
        }
      });

      logger.info('FHIR resource stored in FHIR Service', {
        resourceType,
        resourceId,
        location: response.headers.location || url,
        etag: response.headers.etag
      });

      return {
        success: true,
        storageMode: 'fhir-service',
        location: response.headers.location || url,
        etag: response.headers.etag,
        resourceId,
        resourceType,
        versionId: response.data.meta?.versionId
      };
    } catch (error) {
      logger.error('Failed to store FHIR resource', {
        error: error.message,
        resourceType: resource.resourceType,
        resourceId: resource.id
      });
      
      return {
        success: false,
        error: error.message,
        storageMode: this.storageMode
      };
    }
  }

  /**
   * Retrieve a FHIR resource
   * @param {string} resourceType - Type of FHIR resource
   * @param {string} resourceId - ID of the resource
   * @returns {Object} FHIR resource or null
   */
  async getResource(resourceType, resourceId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const url = `${this.fhirServerUrl}/${resourceType}/${resourceId}`;
      const response = await axios.get(url, {
        headers: this.fhirServerHeaders
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to retrieve FHIR resource', {
        error: error.message,
        resourceType,
        resourceId
      });
      return null;
    }
  }

  /**
   * List resources for a patient
   * @param {string} patientId - Patient identifier
   * @returns {Array} List of resource metadata
   */
  async listPatientResources(patientId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Query FHIR server for patient resources
      const queries = [
        `${this.fhirServerUrl}/RiskAssessment?subject=Patient/${patientId}`,
        `${this.fhirServerUrl}/Observation?subject=Patient/${patientId}`
      ];

      const resources = [];
      for (const query of queries) {
        try {
          const response = await axios.get(query, {
            headers: this.fhirServerHeaders
          });
          
          if (response.data.entry) {
            resources.push(...response.data.entry.map(entry => ({
              resourceType: entry.resource.resourceType,
              resourceId: entry.resource.id,
              fullUrl: entry.fullUrl,
              lastUpdated: entry.resource.meta?.lastUpdated
            })));
          }
        } catch (error) {
          logger.warn('Failed to query FHIR server', { query, error: error.message });
        }
      }

      return resources;
    } catch (error) {
      logger.error('Failed to list patient resources', {
        error: error.message,
        patientId
      });
      return [];
    }
  }
}


// Export singleton instance
module.exports = new FHIRStorageService();