import type { ApiError } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:44399/api';

// ── Enum Mappings (Backend sends integers, FE needs strings) ──
const ENUM_MAPS: Record<string, string[]> = {
  role: ['Admin', 'Staff', 'Client'],
  status: ['Draft', 'Intake', 'Pending', 'MissingInfo', 'InProgress', 'Done', 'Cancelled'],
  priority: ['Low', 'Medium', 'High', 'Urgent'],
  type: ['Text', 'File', 'System', 'MissingInfo', 'IntakeQuestion', 'IntakeAnswer'],
  clientRole: ['Owner', 'Member'],
  participantRole: ['Creator', 'Assignee', 'Observer'],
};

/**
 * Recursively convert numeric enum values to their string equivalents.
 * Matches known field names (role, status, priority, type) in any nested object/array.
 */
export function normalizeEnums<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(normalizeEnums) as T;
  if (typeof data !== 'object') return data;

  const result: Record<string, unknown> = { ...(data as Record<string, unknown>) };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'number' && ENUM_MAPS[key]) {
      result[key] = ENUM_MAPS[key][value] ?? value;
    } else if (typeof value === 'object') {
      result[key] = normalizeEnums(value);
    }
  }
  return result as T;
}

// Build reverse maps: string → number (e.g. 'Client' → 2)
const ENUM_REVERSE: Record<string, Record<string, number>> = {};
for (const [field, values] of Object.entries(ENUM_MAPS)) {
  ENUM_REVERSE[field] = {};
  values.forEach((str, idx) => {
    ENUM_REVERSE[field][str] = idx;
  });
}

/**
 * Recursively convert string enum values to their numeric equivalents.
 * Used when sending data TO the backend (POST/PUT/PATCH).
 */
function denormalizeEnums(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(denormalizeEnums);
  if (typeof data !== 'object') return data;

  const result: Record<string, unknown> = { ...(data as Record<string, unknown>) };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && ENUM_REVERSE[key] && value in ENUM_REVERSE[key]) {
      result[key] = ENUM_REVERSE[key][value];
    } else if (typeof value === 'object') {
      result[key] = denormalizeEnums(value);
    }
  }
  return result;
}

// ── Custom Error ──────────────────────────────────────
export class ApiRequestError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, title: string, errors?: Record<string, string[]>) {
    super(title);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errors = errors;
  }
}

// ── Token helpers ─────────────────────────────────────
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// ── Refresh token logic ──────────────────────────────
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  // Snapshot the refresh token before the async call so we can detect
  // if another concurrent reload already refreshed it successfully.
  const rtAtStart = getRefreshToken();
  if (!rtAtStart) return false;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rtAtStart }),
      });

      if (!res.ok) {
        // Another concurrent reload may have already refreshed with this RT.
        // If localStorage now has a different (newer) RT, we're still good.
        const currentRt = getRefreshToken();
        if (currentRt && currentRt !== rtAtStart) {
          return true;
        }
        return false;
      }

      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Core request function ────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  // Handle 401 — try refresh
  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request<T>(endpoint, options, false);
    }
    // Refresh failed — clear tokens and redirect to login
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiRequestError(401, 'Session expired');
  }

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      title: `HTTP ${res.status}`,
      status: res.status,
    }));
    throw new ApiRequestError(res.status, error.message ?? error.title, error.errors);
  }

  const json = await res.json();
  return normalizeEnums(json);
}

// ── Public API helpers ───────────────────────────────
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(denormalizeEnums(body)),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(denormalizeEnums(body)),
    }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(denormalizeEnums(body)),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, {
      method: 'POST',
      body: formData,
    }),
};

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // 10s buffer for clock skew
    return Date.now() >= payload.exp * 1000 - 10_000;
  } catch {
    return true;
  }
}

export { setTokens, clearTokens, getAccessToken, getRefreshToken };
