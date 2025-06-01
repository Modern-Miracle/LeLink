/**
 * @fileoverview FHIR Storage Service with Blob Storage (Azurite/Azure)
 * @module services/fhirStorage
 *
 * Provides FHIR resource storage using environment-based blob storage:
 * - Development: Azurite (local emulator)
 * - Production: Azure Blob Storage (cloud)
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { Logger } from '../utils/logger.js';

export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    source?: string;
    environment?: string;
  };
  [key: string]: any;
}

export interface StorageResult {
  success: boolean;
  storageMode: 'azurite' | 'azure-blob';
  location?: string;
  etag?: string;
  resourceId: string;
  resourceType: string;
  containerName?: string;
  blobName?: string;
  error?: string;
}

/**
 * FHIR Storage Service using Blob Storage (Environment-based)
 */
export class FHIRStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;
  private logger: Logger;
  private storageMode: 'azurite' | 'azure-blob';
  private initialized: boolean = false;

  constructor() {
    this.logger = new Logger();

    // Detect environment and configure storage
    const isProduction = process.env.NODE_ENV === 'production';
    // Use file system for development to avoid Azurite issues
    this.storageMode = isProduction ? 'azure-blob' : 'azurite';

    // Set container name based on environment
    this.containerName = isProduction ? 'fhir-resources-prod' : 'fhir-resources';

    // Configure connection string based on environment
    const connectionString = this.getConnectionString();
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    this.logger.info('FHIR Storage Service initialized', {
      storageMode: this.storageMode,
      containerName: this.containerName,
      environment: process.env.NODE_ENV || 'development',
    });
  }

  /**
   * Get appropriate connection string based on environment
   */
  private getConnectionString(): string {
    if (this.storageMode === 'azure-blob') {
      // Production: Use Azure Blob Storage
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!connectionString) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING is required for production');
      }
      return connectionString;
    } else {
      // Development: Use Azurite with compatible API version
      return 'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';
    }
  }

  /**
   * Initialize storage containers
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create container if it doesn't exist
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const containerExists = await containerClient.exists();

      if (!containerExists) {
        await containerClient.create();
        this.logger.info('Created FHIR storage container', {
          containerName: this.containerName,
          storageMode: this.storageMode,
        });
      }

      this.initialized = true;
      this.logger.info('FHIR Storage Service ready', {
        storageMode: this.storageMode,
        containerName: this.containerName,
      });
    } catch (error) {
      this.logger.error('Failed to initialize FHIR storage', {
        error: error as Error,
        storageMode: this.storageMode,
        containerName: this.containerName,
      });
      throw error;
    }
  }

  /**
   * Store FHIR resource as JSON blob
   */
  public async storeResource(resource: FHIRResource): Promise<StorageResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Add metadata
      resource.meta = {
        ...resource.meta,
        lastUpdated: new Date().toISOString(),
        source: 'LeLink-Triage-AI',
        environment: process.env.NODE_ENV || 'development',
      };

      // Extract patient ID and create blob path: patientId/ResourceType/resourceId.json
      const patientId = this.extractPatientId(resource);
      const blobName = this.createBlobPath(resource, patientId);

      // Upload JSON content
      const content = JSON.stringify(resource, null, 2);

      // Debug: Log the exact blob name being created
      this.logger.info('Creating blob with path', {
        resourceType: resource.resourceType,
        resourceId: resource.id,
        patientId: patientId,
        blobName: blobName,
        storageMode: this.storageMode,
        containerName: this.containerName,
        contentLength: content.length
      });

      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      // Debug: Check if blob already exists
      const exists = await blockBlobClient.exists();
      this.logger.info('Blob existence check', {
        blobName,
        exists,
        resourceType: resource.resourceType,
        resourceId: resource.id
      });
      
      const uploadResponse = await blockBlobClient.upload(content, content.length, {
        blobHTTPHeaders: {
          blobContentType: 'application/json',
        },
        metadata: {
          resourceType: resource.resourceType,
          resourceId: resource.id,
          patientId: patientId,
          storageMode: this.storageMode,
          environment: process.env.NODE_ENV || 'development',
        },
      });

      this.logger.info('FHIR resource stored successfully', {
        resourceType: resource.resourceType,
        resourceId: resource.id,
        patientId: patientId,
        blobName,
        storageMode: this.storageMode,
        etag: uploadResponse.etag,
        requestId: uploadResponse.requestId,
        version: uploadResponse.version,
        lastModified: uploadResponse.lastModified,
      });

      return {
        success: true,
        storageMode: this.storageMode,
        location: blobName,
        etag: uploadResponse.etag,
        resourceId: resource.id,
        resourceType: resource.resourceType,
        containerName: this.containerName,
        blobName,
      };
    } catch (error) {
      let patientId = 'unknown';
      try {
        patientId = this.extractPatientId(resource);
      } catch {
        // Ignore extraction errors in error handling
      }
      
      this.logger.error('Failed to store FHIR resource', {
        error: error as Error,
        resourceType: resource.resourceType,
        resourceId: resource.id,
        patientId: patientId,
        storageMode: this.storageMode,
      });

      return {
        success: false,
        storageMode: this.storageMode,
        resourceId: resource.id,
        resourceType: resource.resourceType,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Retrieve FHIR resource from blob storage
   */
  public async getResource(patientId: string, resourceType: string, resourceId: string): Promise<FHIRResource | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const blobName = `${this.sanitizeBlobName(patientId)}/${resourceType}/${this.sanitizeBlobName(resourceId)}.json`;
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const downloadResponse = await blockBlobClient.download();
      const content = await this.streamToBuffer(downloadResponse.readableStreamBody!);
      const contentString = content.toString();
      
      // Debug: Log first 100 characters to see what we're getting
      this.logger.debug('Raw content from blob', {
        contentPreview: contentString.substring(0, 100),
        contentLength: contentString.length,
        blobName
      });
      
      const resource = JSON.parse(contentString) as FHIRResource;

      this.logger.debug('FHIR resource retrieved', {
        patientId,
        resourceType,
        resourceId,
        blobName,
        storageMode: this.storageMode,
      });

      return resource;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return null;
      }

      this.logger.error('Failed to retrieve FHIR resource', {
        error: error as Error,
        patientId,
        resourceType,
        resourceId,
        storageMode: this.storageMode,
      });
      throw error;
    }
  }

  /**
   * List all resources for a patient
   */
  public async listPatientResources(patientId: string): Promise<FHIRResource[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const resources: FHIRResource[] = [];

      // Search all resource types for this patient using new structure: patientId/ResourceType/
      const resourceTypes = ['Patient', 'Practitioner', 'Observation', 'RiskAssessment', 'Encounter'];

      for (const resourceType of resourceTypes) {
        const prefix = `${this.sanitizeBlobName(patientId)}/${resourceType}/`;

        for await (const blob of containerClient.listBlobsFlat({ prefix })) {
          try {
            const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            const downloadResponse = await blockBlobClient.download();
            const content = await this.streamToBuffer(downloadResponse.readableStreamBody!);
            const resource = JSON.parse(content.toString()) as FHIRResource;
            resources.push(resource);
          } catch (parseError) {
            this.logger.warn('Failed to parse FHIR resource blob', {
              blobName: blob.name,
              error: parseError as Error,
            });
          }
        }
      }

      this.logger.debug('Listed patient resources', {
        patientId,
        resourceCount: resources.length,
        storageMode: this.storageMode,
      });

      return resources;
    } catch (error) {
      this.logger.error('Failed to list patient resources', {
        error: error as Error,
        patientId,
        storageMode: this.storageMode,
      });
      throw error;
    }
  }

  /**
   * Search resources by type across all patients
   * Optimized version that uses blob prefix filtering instead of downloading all blobs
   */
  public async searchResourcesByType(resourceType: string): Promise<FHIRResource[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const resources: FHIRResource[] = [];
      
      this.logger.debug('Starting optimized search by resource type', {
        resourceType,
        storageMode: this.storageMode,
      });

      // Use a more targeted approach: look for blobs matching pattern */ResourceType/*
      // But limit the search scope to avoid timeouts
      let blobCount = 0;
      const maxBlobs = 100; // Safety limit to prevent infinite loops
      
      for await (const blob of containerClient.listBlobsFlat()) {
        blobCount++;
        
        // Safety check to prevent runaway queries
        if (blobCount > maxBlobs) {
          this.logger.warn('Reached maximum blob search limit', {
            maxBlobs,
            resourceType,
            foundResources: resources.length,
          });
          break;
        }

        // Check if blob path matches: patientId/ResourceType/resourceId.json
        const pathParts = blob.name.split('/');
        if (pathParts.length === 3 && pathParts[1] === resourceType) {
          try {
            const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            const downloadResponse = await blockBlobClient.download();
            const content = await this.streamToBuffer(downloadResponse.readableStreamBody!);
            const resource = JSON.parse(content.toString()) as FHIRResource;
            resources.push(resource);
            
            this.logger.debug('Found resource', {
              resourceType,
              resourceId: resource.id,
              blobName: blob.name,
            });
          } catch (parseError) {
            this.logger.warn('Failed to parse FHIR resource blob', {
              blobName: blob.name,
              error: parseError as Error,
            });
          }
        }
      }

      this.logger.debug('Search completed', {
        resourceType,
        resourceCount: resources.length,
        totalBlobsChecked: blobCount,
        storageMode: this.storageMode,
      });

      return resources;
    } catch (error) {
      this.logger.error('Failed to search resources by type', {
        error: error as Error,
        resourceType,
        storageMode: this.storageMode,
      });
      throw error;
    }
  }

  /**
   * Get all unique patient IDs from stored resources
   */
  public async getAllPatients(): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const patientIds = new Set<string>();
      
      // List all blobs and extract patient IDs from the hierarchical structure
      for await (const blob of containerClient.listBlobsFlat()) {
        // Extract patient ID from path: patientId/ResourceType/resourceId.json
        const pathParts = blob.name.split('/');
        if (pathParts.length >= 2) {
          // Unsanitize the patient ID (reverse the sanitization)
          const originalPatientId = this.unsanitizeBlobName(pathParts[0]);
          patientIds.add(originalPatientId);
        }
      }

      const patients = Array.from(patientIds);
      this.logger.debug('Listed all patients', {
        patientCount: patients.length,
        storageMode: this.storageMode,
      });

      return patients;
    } catch (error) {
      this.logger.error('Failed to get all patients', {
        error: error as Error,
        storageMode: this.storageMode,
      });
      throw error;
    }
  }

  /**
   * Get all resources for multiple patients
   */
  public async getMultiplePatientResources(patientIds: string[]): Promise<Record<string, FHIRResource[]>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result: Record<string, FHIRResource[]> = {};
      
      // Process each patient in parallel for better performance
      const promises = patientIds.map(async (patientId) => {
        try {
          const resources = await this.listPatientResources(patientId);
          return { patientId, resources };
        } catch (error) {
          this.logger.warn('Failed to get resources for patient', {
            patientId,
            error: error as Error,
          });
          return { patientId, resources: [] };
        }
      });

      const results = await Promise.all(promises);
      
      // Build the result object
      results.forEach(({ patientId, resources }) => {
        result[patientId] = resources;
      });

      this.logger.debug('Retrieved multiple patient resources', {
        patientCount: patientIds.length,
        totalResourceCount: Object.values(result).reduce((sum, resources) => sum + resources.length, 0),
        storageMode: this.storageMode,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get multiple patient resources', {
        error: error as Error,
        patientIds,
        storageMode: this.storageMode,
      });
      throw error;
    }
  }

  /**
   * Create blob path for resource using patient-centric structure
   * Structure: patientId/ResourceType/resourceId.json (hierarchical structure)
   */
  private createBlobPath(resource: FHIRResource, patientId: string): string {
    // Sanitize IDs to ensure Azurite compatibility - replace problematic characters
    const sanitizedPatientId = this.sanitizeBlobName(patientId);
    const sanitizedResourceId = this.sanitizeBlobName(resource.id);
    return `${sanitizedPatientId}/${resource.resourceType}/${sanitizedResourceId}.json`;
  }

  /**
   * Sanitize blob name to ensure Azurite compatibility
   * Replaces problematic characters with safe alternatives
   */
  private sanitizeBlobName(name: string): string {
    return name
      .replace(/-/g, '_')  // Replace dashes with underscores
      .replace(/[^a-zA-Z0-9._]/g, '_');  // Replace any other special chars with underscores
  }

  /**
   * Reverse the sanitization process to get original patient ID
   */
  private unsanitizeBlobName(sanitizedName: string): string {
    // For now, we can't perfectly reverse all sanitization,
    // but we can handle the most common case of dashes
    return sanitizedName.replace(/_/g, '-');
  }

  /**
   * Extract patient ID from resource
   */
  private extractPatientId(resource: FHIRResource): string {
    // For Patient resources, use the resource ID
    if (resource.resourceType === 'Patient') {
      return resource.id;
    }

    // For Practitioner resources, use the resource ID as the "patient" ID for storage purposes
    if (resource.resourceType === 'Practitioner') {
      return resource.id;
    }

    // For other resources, extract from subject reference
    if (resource.subject?.reference) {
      const match = resource.subject.reference.match(/Patient\/(.+)/);
      if (match) {
        return match[1];
      }
    }

    // Fallback: look for identifier with patient system
    if (resource.identifier) {
      for (const identifier of resource.identifier) {
        if (identifier.system === 'http://lelink.local/patient-id' || identifier.system === 'http://lelink.healthcare/user-id') {
          return identifier.value;
        }
      }
    }

    // Final fallback: if we still can't extract patient ID, log details and throw
    this.logger.error('Failed to extract patient ID from resource', {
      resourceType: resource.resourceType,
      resourceId: resource.id,
      hasSubject: !!resource.subject,
      subjectReference: resource.subject?.reference,
      hasIdentifier: !!resource.identifier,
      identifierCount: resource.identifier?.length || 0,
      identifiers: resource.identifier?.map((id: any) => ({ system: id.system, value: id.value })) || []
    });
    
    throw new Error(`Cannot extract patient ID from ${resource.resourceType} resource. Missing subject.reference or identifier with system 'http://lelink.healthcare/user-id'`);
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Get storage status
   */
  public getStatus() {
    return {
      initialized: this.initialized,
      storageMode: this.storageMode,
      containerName: this.containerName,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

// Export singleton instance
export const fhirStorageService = new FHIRStorageService();
