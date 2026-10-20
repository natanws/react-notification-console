import { http, HttpResponse } from 'msw';
import {
  CHANNELS,
  NOTIFICATION_STATUSES,
  type CreateNotificationInput,
  type NotificationStatus,
} from '../api/types';
import { insertNotification, type MockDb } from './db';

/** Same rules as the API's DTO: the recipient format depends on the channel. */
function validateInput(input: CreateNotificationInput): string | null {
  if (!CHANNELS.includes(input.channel)) return 'channel must be one of WEBHOOK, EMAIL, WHATSAPP';
  if (typeof input.payload !== 'object' || input.payload === null)
    return 'payload must be an object';
  const checks = {
    WEBHOOK: /^https?:\/\/\S+$/,
    EMAIL: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
    WHATSAPP: /^\+[1-9]\d{7,14}$/,
  };
  return checks[input.channel].test(input.recipient)
    ? null
    : `recipient is not valid for the ${input.channel} channel`;
}

/** MSW handlers that follow the nest-notification-hub contract. */
export function createHandlers(db: MockDb, baseUrl: string) {
  const url = (path: string) => `${baseUrl}${path}`;

  return [
    http.get(url('/notifications'), ({ request }) => {
      const status = new URL(request.url).searchParams.get('status') as NotificationStatus | null;
      if (!status || !NOTIFICATION_STATUSES.includes(status)) {
        return HttpResponse.json(
          { message: 'Validation failed (enum string is expected)' },
          { status: 400 },
        );
      }
      const items = [...db.notifications.values()]
        .filter((n) => n.status === status)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50);
      return HttpResponse.json(items);
    }),

    http.get(url('/notifications/:id'), ({ params }) => {
      const notification = db.notifications.get(params.id as string);
      if (!notification) {
        return HttpResponse.json(
          { message: `Notification ${params.id} not found` },
          { status: 404 },
        );
      }
      return HttpResponse.json(notification);
    }),

    http.post(url('/notifications'), async ({ request }) => {
      const key = request.headers.get('Idempotency-Key');
      if (!key || !/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
        return HttpResponse.json(
          { message: 'Idempotency-Key header is required' },
          { status: 400 },
        );
      }
      const input = (await request.json()) as CreateNotificationInput;
      const problem = validateInput(input);
      if (problem) return HttpResponse.json({ message: [problem] }, { status: 400 });

      const body = JSON.stringify(input);
      const previous = db.idempotency.get(key);
      if (previous) {
        if (previous.body !== body) {
          return HttpResponse.json(
            { message: 'Idempotency-Key was already used with a different request body' },
            { status: 409 },
          );
        }
        return HttpResponse.json(db.notifications.get(previous.id), { status: 200 });
      }

      const created = insertNotification(db, input);
      db.idempotency.set(key, { id: created.id, body });
      return HttpResponse.json(created, { status: 202 });
    }),

    http.post(url('/notifications/:id/retry'), ({ params }) => {
      const notification = db.notifications.get(params.id as string);
      if (!notification) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      if (notification.status !== 'DEAD_LETTERED') {
        return HttpResponse.json(
          { message: 'Only dead-lettered notifications can be retried' },
          { status: 409 },
        );
      }
      const updated = { ...notification, status: 'PENDING' as const };
      db.notifications.set(updated.id, updated);
      return HttpResponse.json(updated, { status: 202 });
    }),

    http.get(url('/notifications/:id/attempts'), ({ params }) => {
      if (!db.notifications.has(params.id as string)) {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      }
      return HttpResponse.json(db.attempts.get(params.id as string) ?? []);
    }),
  ];
}
