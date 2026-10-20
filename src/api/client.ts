import type {
  CreateNotificationInput,
  DeliveryAttempt,
  Notification,
  NotificationStatus,
} from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** NestJS errors come as { message: string | string[] }; fall back to the status text. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join('; ');
    if (body.message) return body.message;
  } catch {
    // not JSON
  }
  return response.statusText || `HTTP ${response.status}`;
}

export function createApiClient(baseUrl: string) {
  async function send(path: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!response.ok) throw new ApiError(response.status, await errorMessage(response));
    return response;
  }

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    return (await (await send(path, init)).json()) as T;
  }

  return {
    listByStatus: (status: NotificationStatus) =>
      request<Notification[]>(`/notifications?status=${status}`),

    get: (id: string) => request<Notification>(`/notifications/${id}`),

    attempts: (id: string) => request<DeliveryAttempt[]>(`/notifications/${id}/attempts`),

    retry: (id: string) => request<Notification>(`/notifications/${id}/retry`, { method: 'POST' }),

    /** `replayed` is true when the API answered 200: the key was already used for this body. */
    create: async (idempotencyKey: string, input: CreateNotificationInput) => {
      const response = await send('/notifications', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(input),
      });
      return {
        notification: (await response.json()) as Notification,
        replayed: response.status === 200,
      };
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const api = createApiClient(import.meta.env.VITE_API_URL ?? 'http://localhost:3000');
