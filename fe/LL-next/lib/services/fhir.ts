import { AnyFhirResource, Observation, RiskAssessment, Condition } from '@/lib/types/fhir';

export interface FhirServiceConfig {
  baseUrl?: string;
  bearerToken?: string;
}

export class FhirService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config?: FhirServiceConfig) {
    this.baseUrl = config?.baseUrl || process.env.NEXT_PUBLIC_FHIR_SERVER_URL || '';
    this.headers = {
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
    };

    if (config?.bearerToken || process.env.NEXT_PUBLIC_FHIR_SERVER_BEARER_TOKEN) {
      this.headers['Authorization'] = `Bearer ${config?.bearerToken || process.env.NEXT_PUBLIC_FHIR_SERVER_BEARER_TOKEN}`;
    }
  }

  /**
   * Fetch a single FHIR resource by ID
   */
  async getResource<T extends AnyFhirResource>(
    resourceType: string, 
    id: string
  ): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${resourceType}/${id}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${resourceType}/${id}: ${response.status}`);
        return null;
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`Error fetching ${resourceType}/${id}:`, error);
      return null;
    }
  }

  /**
   * Search for FHIR resources
   */
  async searchResources<T extends AnyFhirResource>(
    resourceType: string,
    params?: Record<string, string>
  ): Promise<T[]> {
    try {
      const searchParams = new URLSearchParams(params);
      const url = `${this.baseUrl}/${resourceType}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        console.error(`Failed to search ${resourceType}: ${response.status}`);
        return [];
      }

      const bundle = await response.json();
      
      // Extract resources from FHIR bundle
      if (bundle.resourceType === 'Bundle' && bundle.entry) {
        return bundle.entry.map((entry: any) => entry.resource as T);
      }

      return [];
    } catch (error) {
      console.error(`Error searching ${resourceType}:`, error);
      return [];
    }
  }

  /**
   * Get patient observations
   */
  async getPatientObservations(patientId: string): Promise<Observation[]> {
    return this.searchResources<Observation>('Observation', {
      patient: `Patient/${patientId}`,
      _sort: '-date',
      _count: '20'
    });
  }

  /**
   * Get patient risk assessments
   */
  async getPatientRiskAssessments(patientId: string): Promise<RiskAssessment[]> {
    return this.searchResources<RiskAssessment>('RiskAssessment', {
      subject: `Patient/${patientId}`,
      _sort: '-date',
      _count: '20'
    });
  }

  /**
   * Get patient conditions
   */
  async getPatientConditions(patientId: string): Promise<Condition[]> {
    return this.searchResources<Condition>('Condition', {
      patient: `Patient/${patientId}`,
      _sort: '-onset-date',
      _count: '20'
    });
  }

  /**
   * Get all patient resources
   */
  async getPatientResources(patientId: string): Promise<{
    observations: Observation[];
    riskAssessments: RiskAssessment[];
    conditions: Condition[];
  }> {
    const [observations, riskAssessments, conditions] = await Promise.all([
      this.getPatientObservations(patientId),
      this.getPatientRiskAssessments(patientId),
      this.getPatientConditions(patientId),
    ]);

    return {
      observations,
      riskAssessments,
      conditions,
    };
  }

  /**
   * Create a new FHIR resource
   */
  async createResource<T extends AnyFhirResource>(
    resource: T
  ): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${resource.resourceType}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(resource),
      });

      if (!response.ok) {
        console.error(`Failed to create ${resource.resourceType}: ${response.status}`);
        return null;
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`Error creating ${resource.resourceType}:`, error);
      return null;
    }
  }

  /**
   * Update an existing FHIR resource
   */
  async updateResource<T extends AnyFhirResource>(
    resource: T
  ): Promise<T | null> {
    if (!resource.id) {
      console.error('Cannot update resource without ID');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${resource.resourceType}/${resource.id}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(resource),
      });

      if (!response.ok) {
        console.error(`Failed to update ${resource.resourceType}/${resource.id}: ${response.status}`);
        return null;
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`Error updating ${resource.resourceType}/${resource.id}:`, error);
      return null;
    }
  }

  /**
   * Delete a FHIR resource
   */
  async deleteResource(
    resourceType: string,
    id: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${resourceType}/${id}`, {
        method: 'DELETE',
        headers: this.headers,
      });

      return response.ok;
    } catch (error) {
      console.error(`Error deleting ${resourceType}/${id}:`, error);
      return false;
    }
  }
}

// Export a default instance
export const fhirService = new FhirService();

// Export function to create custom instances
export function createFhirService(config?: FhirServiceConfig): FhirService {
  return new FhirService(config);
}