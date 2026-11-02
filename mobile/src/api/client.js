import { API_BASE_URL } from '../config/api';
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from './tokenStorage';

const DEFAULT_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getErrorMessage(data, fallback) {
  if (typeof data === 'string' && data) {
    return data;
  }
  if (data && typeof data.detail === 'string') {
    return data.detail;
  }
  return fallback;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return text;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(
      'The API returned invalid JSON.',
      response.status,
      text,
    );
  }
}

export async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    headers = {},
    authenticated = true,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = {},
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const requestHeaders = {
      Accept: 'application/json',
      ...headers,
    };
    if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }
    if (authenticated) {
      const token = await getAuthToken();
      if (token) {
        requestHeaders.Authorization = `Token ${token}`;
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/${path.replace(/^\/+/, '')}`,
      {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      },
    );
    const data = await parseResponse(response);
    if (!response.ok) {
      throw new ApiError(
        getErrorMessage(data, response.statusText || 'API request failed.'),
        response.status,
        data,
      );
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError(
        `The API request timed out after ${timeoutMs} ms.`,
        0,
        null,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function authenticate(path, credentials) {
  const response = await apiRequest(path, {
    method: 'POST',
    body: credentials,
    authenticated: false,
  });
  if (typeof response?.token !== 'string' || !response.token) {
    throw new ApiError(
      'The API authentication response did not contain a token.',
      0,
      response,
    );
  }
  await setAuthToken(response.token);
  return response;
}

export const authApi = {
  register: (details) => authenticate('auth/register/', details),
  login: (credentials) => authenticate('auth/login/', credentials),
  async logout() {
    await apiRequest('auth/logout/', { method: 'POST' });
    await clearAuthToken();
  },
  me: () => apiRequest('auth/me/'),
  updateProfile: (changes) =>
    apiRequest('auth/me/', { method: 'PATCH', body: changes }),
};
