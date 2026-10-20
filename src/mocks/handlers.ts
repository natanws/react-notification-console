import { http, HttpResponse } from 'msw';
import { NOTIFICATION_STATUSES, type NotificationStatus } from '../api/types';
import type { MockDb } from './db';

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

    http.get(url('/notifications/:id/attempts'), ({ params }) => {
      if (!db.notifications.has(params.id as string)) {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      }
      return HttpResponse.json(db.attempts.get(params.id as string) ?? []);
    }),
  ];
}
