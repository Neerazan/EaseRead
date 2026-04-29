/**
 * Centralized API client for EaseRead frontend.
 * Handles fetch requests, auth tokens, and response parsing.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  statusCode?: number;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { body, headers: customHeaders, ...restOptions } = options;

    const headers: Record<string, string> = {
      ...(customHeaders as Record<string, string>),
    };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...restOptions,
      headers,
      credentials: 'include', // Send cookies for refresh tokens
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, data: null as T };
    }

    const json = await response.json();

    if (!response.ok) {
      // Backend returns errors in an 'error' object
      const errorData = json.error || {};
      const message = errorData.message || json.message || 'An error occurred';

      // Map 'details' or 'field' to the ApiError 'errors' array
      let errors = errorData.details;
      if (!errors && errorData.field) {
        errors = [
          { field: errorData.field, message: errorData.message || message },
        ];
      }

      throw new ApiError(message, response.status, errors);
    }

    return json;
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  async signUp(data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) {
    return this.request<{ user: UserData }>('/auth/sign-up', {
      method: 'POST',
      body: data,
    });
  }

  async signIn(data: { email: string; password: string }) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: UserData;
      message: string;
    }>('/auth/sign-in', {
      method: 'POST',
      body: data,
    });
  }

  async googleLogin(token: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: UserData;
      message: string;
    }>('/auth/google', {
      method: 'POST',
      body: { token },
    });
  }

  async refreshToken() {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: UserData;
    }>('/auth/refresh-token', {
      method: 'POST',
    });
  }

  async signOut() {
    return this.request('/auth/sign-out', {
      method: 'POST',
    });
  }

  // ── Documents ───────────────────────────────────────────────────────────

  async uploadDocument(file: File, title?: string, author?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (author) formData.append('author', author);

    return this.request<{ data: DocumentData }>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getDocuments(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<DocumentData[]>(
      `/documents${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      },
    );
  }

  async getDocument(id: string) {
    return this.request<DocumentData>(`/documents/${id}`, {
      method: 'GET',
    });
  }

  async deleteDocument(id: string) {
    return this.request(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllDocuments() {
    return this.request('/documents', {
      method: 'DELETE',
    });
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserData {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string;
  tier: 'FREE' | 'PREMIUM';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentData {
  id: string;
  title: string;
  author: string | null;
  format: 'pdf' | 'epub' | 'txt';
  fileUrl: string;
  coverUrl: string | null;
  isProcessed: boolean;
  metadata: Record<string, unknown> | null;
  fileSize: number;
  totalPages: number | null;
  wordsCount: number | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ApiError extends Error {
  status: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status: number,
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Singleton export
export const api = new ApiClient(API_BASE_URL);
