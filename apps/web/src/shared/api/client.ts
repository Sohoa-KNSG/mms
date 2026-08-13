import { z } from 'zod';

const apiBaseUrl = (import.meta.env as { readonly VITE_API_BASE_URL?: string }).VITE_API_BASE_URL ?? '/api/v1';

const problemDetailsSchema = z.object({
  title: z.string().optional(),
  detail: z.string().optional(),
  status: z.number().optional(),
  traceId: z.string().optional(),
});

export class ApiError extends Error {
  readonly status: number;
  readonly traceId: string | undefined;

  constructor(message: string, status: number, traceId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.traceId = traceId;
  }
}

export async function apiGet<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  return apiRequest(path, 'GET', undefined, schema, signal);
}

export async function apiPost<TRequest, TResponse>(
  path: string,
  body: TRequest,
  schema: z.ZodType<TResponse>,
  signal?: AbortSignal,
): Promise<TResponse> {
  return apiRequest(path, 'POST', body, schema, signal);
}

export async function apiPut<TRequest, TResponse>(
  path: string,
  body: TRequest,
  schema: z.ZodType<TResponse>,
  signal?: AbortSignal,
): Promise<TResponse> {
  return apiRequest(path, 'PUT', body, schema, signal);
}

export async function apiPostVoid<TRequest>(path: string, body?: TRequest): Promise<void> {
  const response = await fetch(`${apiBaseUrl}${path}`, { method: 'POST', credentials: 'include',
    headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? null : JSON.stringify(body) });
  if (!response.ok) throw new ApiError('Yêu cầu thất bại.', response.status);
}

async function apiRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT',
  body: unknown,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? null : JSON.stringify(body),
    signal: signal ?? null,
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => ({}));
    const problem = problemDetailsSchema.safeParse(payload);
    throw new ApiError(
      problem.success ? (problem.data.detail ?? problem.data.title ?? 'Yêu cầu thất bại.') : 'Yêu cầu thất bại.',
      response.status,
      problem.success ? problem.data.traceId : undefined,
    );
  }

  const payload: unknown = await response.json();
  return schema.parse(payload);
}
