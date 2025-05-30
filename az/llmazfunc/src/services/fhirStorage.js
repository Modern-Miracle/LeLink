const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const axios = require('axios');
const { Logger } = require('../utils/logger');
const config = require('../utils/config');

const logger = new Logger({ context: 'FHIRStorageService' });

class FHIRStorageService {
  constructor() {
    this.initialized = false;
    this.storageMode = null;
    this.blobServiceClient = null;
    this.containerName = 'fhir-resources';
    this.fhirServerUrl = null;
    this.fhirServerHeaders = {};
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      this.storageMode = isDevelopment ? 'azurite' : 'fhir-service';

      if (this.storageMode === 'azurite') {
        // Development: Use Azurite blob storage
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 
          'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';
        
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Create container if it doesn't exist
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        await containerClient.createIfNotExists({
          access: 'blob',
          metadata: {
            purpose: 'FHIR Resource Storage',
            createdBy: 'LeLink Triage Assistant'
          }
        });

        logger.info('FHIR Storage initialized in Azurite mode', {
          endpoint: 'http://127.0.0.1:10000',
          container: this.containerName
        });
      } else {
        // Production: Use Azure FHIR Service
        this.fhirServerUrl = process.env.FHIR_SERVER_URL;
        
        if (!this.fhirServerUrl) {
          throw new Error('FHIR_SERVER_URL environment variable is required in production');
        }

        // Set up authentication based on auth type
        const authType = process.env.FHIR_AUTH_TYPE || 'bearer-token';
        
        switch (authType) {
          case 'managed-identity':
            // Use DefaultAzureCredential for managed identity
            await this.setupManagedIdentityAuth();
            break;
            
          case 'service-principal':
            // Use service principal authentication
            await this.setupServicePrincipalAuth();
            break;
            
          case 'bearer-token':
          default:
            // Use bearer token authentication
            if (process.env.FHIR_SERVER_BEARER_TOKEN) {
              this.fhirServerHeaders.Authorization = `Bearer ${process.env.FHIR_SERVER_BEARER_TOKEN}`;
            }
            break;
        }

        // Test connection
        try {
          const response = await axios.get(`${this.fhirServerUrl}/metadata`, {
            headers: this.fhirServerHeaders,
            timeout: 5000
          });
          
          logger.info('FHIR Service connection verified', {
            serverUrl: this.fhirServerUrl,
            version: response.data.fhirVersion,
            authType: authType
          });
        } catch (error) {
          logger.warn('FHIR Service connection test failed', { 
            error: error.message,
            serverUrl: this.fhirServerUrl,
            authType: authType
          });
          // Don't throw - allow initialization to continue
        }
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize FHIR storage', error);
      throw error;
    }
  }

  /**
   * Set up managed identity authentication using DefaultAzureCredential
   */
  async setupManagedIdentityAuth() {
    try {
      const credential = new DefaultAzureCredential();
      
      // Get access token for Azure Health Data Services
      const tokenResponse = await credential.getToken('https://azurehealthcareapis.com/.default');
      
      if (tokenResponse && tokenResponse.token) {
        this.fhirServerHeaders.Authorization = `Bearer ${tokenResponse.token}`;
        
        // Set up token refresh
        this.credential = credential;
        this.tokenScope = 'https://azurehealthcareapis.com/.default';
        
        logger.info('Managed identity authentication configured successfully');
      } else {
        throw new Error('Failed to obtain access token');
      }
    } catch (error) {
      logger.error('Failed to set up managed identity authentication', error);
      throw new Error(`Managed identity setup failed: ${error.message}`);
    }
  }

  /**
   * Set up service principal authentication
   */
  async setupServicePrincipalAuth() {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Service principal authentication requires AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET');
    }
    
    try {
      // Get access token using service principal
      const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      
      const params = new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': clientId,
        'client_secret': clientSecret,
        'scope': 'https://azurehealthcareapis.com/.default'
      });
      
      const response = await axios.post(tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.data && response.data.access_token) {
        this.fhirServerHeaders.Authorization = `Bearer ${response.data.access_token}`;
        
        // Store credentials for token refresh
        this.servicePrincipal = { tenantId, clientId, clientSecret };
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        
        logger.info('Service principal authentication configured successfully', {
          tenantId: tenantId,
          clientId: clientId
        });
      } else {
        throw new Error('Failed to obtain access token');
      }
    } catch (error) {
      logger.error('Failed to set up service principal authentication', error);
      throw new Error(`Service principal setup failed: ${error.message}`);
    }
  }

  /**
   * Refresh authentication token if needed
   */
  async refreshAuthIfNeeded() {
    // For managed identity
    if (this.credential && this.tokenScope) {
      try {
        const tokenResponse = await this.credential.getToken(this.tokenScope);
        if (tokenResponse && tokenResponse.token) {
          this.fhirServerHeaders.Authorization = `Bearer ${tokenResponse.token}`;
        }
      } catch (error) {
        logger.warn('Failed to refresh managed identity token', error);
      }
    }
    
    // For service principal
    if (this.servicePrincipal && this.tokenExpiry) {
      // Refresh if token expires in less than 5 minutes
      if (Date.now() > this.tokenExpiry - 300000) {
        await this.setupServicePrincipalAuth();
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

      if (this.storageMode === 'azurite') {
        // Store in Azurite blob storage
        const blobName = `${resourceType}/${resourceId}.json`;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const content = JSON.stringify(resource, null, 2);
        const uploadResponse = await blockBlobClient.upload(content, content.length, {
          blobHTTPHeaders: {
            blobContentType: 'application/fhir+json'
          },
          metadata: {
            resourceType,
            resourceId,
            patientId: resource.subject?.reference || 'unknown',
            createdAt: new Date().toISOString()
          }
        });

        logger.info('FHIR resource stored in Azurite', {
          resourceType,
          resourceId,
          blobName,
          etag: uploadResponse.etag
        });

        return {
          success: true,
          storageMode: 'azurite',
          location: blockBlobClient.url,
          blobName,
          etag: uploadResponse.etag,
          resourceId,
          resourceType
        };
      } else {
        // Production: Refresh auth if needed before making request
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
      }
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
      if (this.storageMode === 'azurite') {
        const blobName = `${resourceType}/${resourceId}.json`;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const downloadResponse = await blockBlobClient.download(0);
        const content = await streamToString(downloadResponse.readableStreamBody);
        
        return JSON.parse(content);
      } else {
        const url = `${this.fhirServerUrl}/${resourceType}/${resourceId}`;
        const response = await axios.get(url, {
          headers: this.fhirServerHeaders
        });
        
        return response.data;
      }
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
      if (this.storageMode === 'azurite') {
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const resources = [];

        // List all blobs and filter by patient
        for await (const blob of containerClient.listBlobsFlat({ includeMetadata: true })) {
          if (blob.metadata?.patientId === patientId || 
              blob.metadata?.patientId?.includes(patientId)) {
            resources.push({
              name: blob.name,
              resourceType: blob.metadata.resourceType,
              resourceId: blob.metadata.resourceId,
              createdAt: blob.metadata.createdAt,
              size: blob.properties.contentLength,
              etag: blob.properties.etag
            });
          }
        }

        return resources;
      } else {
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
      }
    } catch (error) {
      logger.error('Failed to list patient resources', {
        error: error.message,
        patientId
      });
      return [];
    }
  }
}

// Helper function to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}

// Export singleton instance
module.exports = new FHIRStorageService();