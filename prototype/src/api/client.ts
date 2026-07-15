export const BASE_URL = '/api';

export type ApiError = {
  status: number;
  error: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function parseErrorBody(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    // Fall through to status text.
  }
  return response.statusText || 'request-failed';
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      error: await parseErrorBody(response),
    };
    throw error;
  }

  return (await response.json()) as T;
}
