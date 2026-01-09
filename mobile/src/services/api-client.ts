/**
 * API client for backend communication
 */
import { API_BASE_URL, API_TIMEOUT } from '../utils/constants';

/**
 * HTTP methods
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API error with additional context
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * Request options
 */
interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Create abort controller with timeout
 */
function createTimeoutController(timeout: number): {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
}

/**
 * Make API request
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = API_TIMEOUT,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const { controller, timeoutId } = createTimeoutController(timeout);

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: controller.signal,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: { message?: string; code?: string; details?: unknown } = {};

      if (isJson) {
        try {
          errorData = await response.json();
        } catch {
          // Ignore JSON parse errors
        }
      }

      throw new ApiError(
        errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    if (!isJson) {
      return {} as T;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }
      throw new ApiError(error.message, 0, 'NETWORK_ERROR');
    }

    throw new ApiError('Unknown error occurred', 0, 'UNKNOWN');
  }
}

/**
 * API client with typed methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'POST', body });
  },

  /**
   * PUT request
   */
  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PUT', body });
  },

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await request<{ status: string }>('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Crawl request input
 */
export interface CrawlRequest {
  url: string;
}

/**
 * Crawl response from API
 */
export interface CrawlResponse {
  success: boolean;
  data: {
    title: string;
    text: string;
    authorName: string | null;
    authorId: string | null;
    originalDate: number | null;
    viewCount: number | null;
    likeCount: number | null;
    media: Array<{
      type: 'image' | 'video';
      url: string;
      fileSize?: number;
    }>;
  };
}

/**
 * Analyze request input
 */
export interface AnalyzeRequest {
  title: string | null;
  text: string;
  mediaCount: number;
}

/**
 * Analyze response from API
 */
export interface AnalyzeResponse {
  success: boolean;
  data: {
    labels: string[];
    summary: string;
    contentType: string | null;
    suggestedGroupId: string | null;
    suggestedGroupName: string | null;
    modelVersion: string;
  };
}

/**
 * Specialized API methods for XHS operations
 */
export const xhsApi = {
  /**
   * Crawl XHS post content
   */
  crawl(url: string): Promise<CrawlResponse> {
    return apiClient.post<CrawlResponse>('/crawl', { url });
  },

  /**
   * Analyze post content with AI
   */
  analyze(input: AnalyzeRequest): Promise<AnalyzeResponse> {
    return apiClient.post<AnalyzeResponse>('/analyze', input);
  },
};
