import type { ApiErrorBody } from '@/types/api';
import { useAuthStore } from '@/lib/auth/auth-store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/** Normalized error thrown by the client for any non-2xx response. */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly messages: string[];
  readonly details?: unknown;

  constructor(body: ApiErrorBody) {
    const messages = Array.isArray(body.message) ? body.message : [body.message];
    super(messages[0] ?? 'Request failed');
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.code = body.code;
    this.messages = messages;
    this.details = body.details;
  }

  get isUnauthorized() {
    return this.statusCode === 401;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Attach bearer token (default true). Set false for public endpoints. */
  auth?: boolean;
  /** Idempotency-Key header (order checkout). */
  idempotencyKey?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Internal: skip the 401 → refresh retry (used by the refresh call itself). */
  _retry?: boolean;
}

// ---- single-flight refresh ----
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const { refreshToken, setTokens } = useAuthStore.getState();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
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

function redirectToLogin() {
  useAuthStore.getState().clear();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/sign-in')) {
    window.location.href = '/sign-in';
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = true,
    idempotencyKey,
    headers = {},
    signal,
    _retry,
  } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders: Record<string, string> = { ...headers };
  // FormData → let the browser set multipart Content-Type (with boundary).
  if (body !== undefined && !isFormData) finalHeaders['Content-Type'] = 'application/json';
  if (idempotencyKey) finalHeaders['Idempotency-Key'] = idempotencyKey;
  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    signal,
  });

  // 401 → try one refresh + retry (only on authed, non-retry requests).
  if (res.status === 401 && auth && !_retry) {
    const ok = await refreshTokens();
    if (ok) return apiFetch<T>(path, { ...options, _retry: true });
    redirectToLogin();
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    throw new ApiError(
      (data as ApiErrorBody) ?? {
        statusCode: res.status,
        code: 'ERROR',
        message: 'Request failed',
      },
    );
  }
  return data as T;
}

/** Authed file download (PDF etc): fetches a blob and triggers a browser download. */
export async function apiDownload(path: string, filename: string, _retry = false): Promise<void> {
  const headers: Record<string, string> = {};
  const token = useAuthStore.getState().accessToken;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { headers });

  if (res.status === 401 && !_retry) {
    const ok = await refreshTokens();
    if (ok) return apiDownload(path, filename, true);
    redirectToLogin();
    return;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const data = text ? (JSON.parse(text) as ApiErrorBody) : undefined;
    throw new ApiError(
      data ?? { statusCode: res.status, code: 'ERROR', message: 'Download failed' },
    );
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
