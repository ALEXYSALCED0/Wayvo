/**
 * Reusable HTTP API Client for Wayvo Frontend
 */
import { API_BASE_URL } from '../../config/apiConfig';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setBaseUrl(newUrl: string) {
    this.baseUrl = newUrl.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

    try {
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: json.error || `HTTP error ${response.status}`,
        };
      }

      return json;
    } catch (err: any) {
      console.warn(`[ApiClient] Network request failed for ${url}:`, err.message);
      return {
        success: false,
        error: err.message || 'Wayvo could not connect to the server.',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
