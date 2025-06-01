/**
 * @fileoverview FHIR Storage API Client
 * @module lib/fhir-storage/client
 * 
 * HTTP client for FHIR Storage API with retry logic and error handling
 */

import { APIResponse, FHIRStorageConfig, FHIRStorageAPIError, DEFAULT_CONFIG } from './types'

export class FHIRStorageClient {
  private config: FHIRStorageConfig

  constructor(config: Partial<FHIRStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`
    
    console.log(`🌐 [FHIR Client] Making request to: ${url}`)
    console.log(`🌐 [FHIR Client] Request options:`, {
      method: options.method || 'GET',
      hasBody: !!options.body,
      headersCount: Object.keys(options.headers || {}).length
    })
    
    let lastError: Error | null = null
    const maxRetries = this.config.retries || 2

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 [FHIR Client] Retry attempt ${attempt}/${maxRetries} for: ${url}`)
          // Add exponential backoff delay between retries
          const delay = (this.config.retryDelay || 2000) * attempt
          console.log(`⏳ [FHIR Client] Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        const controller = new AbortController()
        const timeoutId = setTimeout(
          () => {
            console.log(`⏰ [FHIR Client] Request timeout after ${this.config.timeout || 30000}ms for: ${url}`)
            controller.abort()
          },
          this.config.timeout || 30000
        )

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })

        clearTimeout(timeoutId)

        console.log(`📡 [FHIR Client] Response from ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          contentType: response.headers.get('content-type')
        })

        if (!response.ok) {
          const errorMsg = `HTTP ${response.status}: ${response.statusText}`
          console.error(`❌ [FHIR Client] HTTP error for ${url}:`, errorMsg)
          throw new FHIRStorageAPIError(
            errorMsg,
            'HTTP_ERROR',
            { status: response.status, statusText: response.statusText }
          )
        }

        const data: APIResponse<T> = await response.json()
        
        console.log(`📊 [FHIR Client] Parsed response data:`, {
          success: data.success,
          hasData: !!data.data,
          hasError: !!data.error,
          message: data.message,
          timestamp: data.timestamp,
          dataKeys: data.data ? Object.keys(data.data) : []
        })

        if (!data.success && data.error) {
          console.error(`❌ [FHIR Client] API error for ${url}:`, data.error)
          throw new FHIRStorageAPIError(
            data.error,
            'API_ERROR',
            { response: data }
          )
        }

        console.log(`✅ [FHIR Client] Successful response from ${url}`)
        return data

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`💥 [FHIR Client] Error on attempt ${attempt + 1} for ${url}:`, lastError.message)

        // Don't retry on client errors (4xx) or last attempt
        if (error instanceof FHIRStorageAPIError && 
            error.details?.status >= 400 && 
            error.details?.status < 500) {
          break
        }

        if (attempt === maxRetries) {
          break
        }

        // Wait before retry
        if (this.config.retryDelay) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
        }
      }
    }

    throw lastError || new FHIRStorageAPIError('Request failed after retries')
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' })
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FHIRStorageConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): FHIRStorageConfig {
    return { ...this.config }
  }
}

// Default client instance
export const fhirStorageClient = new FHIRStorageClient()

// Utility function to create custom client
export function createFHIRStorageClient(config?: Partial<FHIRStorageConfig>): FHIRStorageClient {
  return new FHIRStorageClient(config)
}