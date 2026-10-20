import type { DeliveryAttempt, Notification } from '../api/types';

/**
 * In-memory stand-in for the API's database. Used by the tests and by the static demo build, so
 * both exercise the same behavior as the real service (idempotency, retry rules).
 */
export interface MockDb {
  notifications: Map<string, Notification>;
  attempts: Map<string, DeliveryAttempt[]>;
  idempotency: Map<string, { id: string; body: string }>;
}

export function createDb(): MockDb {
  return { notifications: new Map(), attempts: new Map(), idempotency: new Map() };
}

const uuid = () => crypto.randomUUID();
export function insertNotification(db: MockDb, partial: Partial<Notification> = {}): Notification {
  const now = new Date().toISOString();
  const notification: Notification = {
    id: uuid(),
    channel: 'WEBHOOK',
    recipient: 'https://example.com/hooks/orders',
    payload: { orderId: 1 },
    status: 'PENDING',
    attempts: 0,
    lastError: null,
    deliveredAt: null,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
  db.notifications.set(notification.id, notification);
  db.attempts.set(notification.id, db.attempts.get(notification.id) ?? []);
  return notification;
}

export function addAttempt(
  db: MockDb,
  notificationId: string,
  attempt: Pick<DeliveryAttempt, 'success' | 'error' | 'durationMs'>,
): DeliveryAttempt {
  const list = db.attempts.get(notificationId) ?? [];
  const created: DeliveryAttempt = {
    id: uuid(),
    notificationId,
    attempt: list.length + 1,
    createdAt: new Date().toISOString(),
    ...attempt,
  };
  db.attempts.set(notificationId, [...list, created]);
  return created;
}
