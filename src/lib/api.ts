/**
 * Type-safe API client for communicating with the FastAPI backend
 * All requests are proxied through /api/backend/ route
 */

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  isError: boolean;
}

/**
 * Generic API request function
 * @template T - Response type
 * @template B - Request body type
 * @param endpoint - API endpoint (without /api/backend/ prefix)
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise with typed response or error
 */
async function apiRequest<T = unknown, B = unknown>(
  endpoint: string,
  options: {
    method?: string;
    body?: B;
    headers?: Record<string, string>;
  } = {},
): Promise<ApiResponse<T>> {
  try {
    const { body, headers: customHeaders, method, ...fetchOptions } = options;

    // Build the full URL with /api/backend/ prefix
    const url = `/api/backend/${endpoint}`;

    // Prepare headers with proper type handling
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    // Build fetch options
    const fetchConfig: RequestInit = {
      ...fetchOptions,
      method: method || 'GET',
      headers,
    };

    // Add body if provided (stringify if needed)
    if (body !== undefined) {
      fetchConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Make the request
    const response = await fetch(url, fetchConfig);

    // Parse response
    const contentType = response.headers.get('content-type');
    let data: T;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = (await response.text()) as unknown as T;
    } else {
      data = (await response.blob()) as unknown as T;
    }

    // Handle HTTP errors
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${url}`, data);

      return {
        data: undefined,
        error: {
          error: 'API request failed',
          message:
            typeof data === 'object' && data !== null && 'message' in data
              ? String((data as Record<string, unknown>).message)
              : `HTTP ${response.status}`,
          status: response.status,
        },
        isError: true,
      };
    }

    return {
      data,
      error: undefined,
      isError: false,
    };
  } catch (error) {
    // Handle network errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('API Client Error:', error);

    return {
      data: undefined,
      error: {
        error: 'Failed to connect to backend',
        message: errorMessage,
      },
      isError: true,
    };
  }
}

/**
 * Convenience API methods
 */
export const api = {
  /**
   * GET request
   * @template T - Response type
   */
  async get<T = unknown>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
      method: 'GET',
      headers,
    });
  },

  /**
   * POST request
   * @template T - Response type
   * @template B - Request body type
   */
  async post<T = unknown, B = unknown>(
    endpoint: string,
    body?: B,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T, B>(endpoint, {
      method: 'POST',
      body,
      headers,
    });
  },
};
