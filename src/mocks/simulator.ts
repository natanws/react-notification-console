import { addAttempt, insertNotification, type MockDb } from './db';

const MAX_ATTEMPTS = 3;

/** Recipients containing "fail" behave like a broken receiver until the user retries them. */
function receiverIsDown(recipient: string, retried: Set<string>, id: string): boolean {
  return recipient.includes('fail') && !retried.has(id);
}

/**
 * Advances every notification one step, the way the worker would:
 * PENDING/FAILED -> PROCESSING -> DELIVERED, or FAILED (retry) / DEAD_LETTERED (gave up).
 */
export function tick(db: MockDb, retried: Set<string>): void {
  for (const n of db.notifications.values()) {
    const now = new Date().toISOString();

    if (n.status === 'PENDING' || n.status === 'FAILED') {
      db.notifications.set(n.id, { ...n, status: 'PROCESSING', updatedAt: now });
      continue;
    }
    if (n.status !== 'PROCESSING') continue;

    const durationMs = 40 + Math.round(Math.random() * 300);
    if (!receiverIsDown(n.recipient, retried, n.id)) {
      addAttempt(db, n.id, { success: true, error: null, durationMs });
      db.notifications.set(n.id, {
        ...n,
        status: 'DELIVERED',
        attempts: n.attempts + 1,
        lastError: null,
        deliveredAt: now,
        updatedAt: now,
      });
      continue;
    }

    const error = 'Webhook answered 503';
    addAttempt(db, n.id, { success: false, error, durationMs });
    const attempts = n.attempts + 1;
    db.notifications.set(n.id, {
      ...n,
      status: attempts >= MAX_ATTEMPTS ? 'DEAD_LETTERED' : 'FAILED',
      attempts,
      lastError: error,
      updatedAt: now,
    });
  }
}

/** A few notifications in every state, so each screen has something to show. */
export function seed(db: MockDb): void {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

  const delivered = insertNotification(db, {
    status: 'DELIVERED',
    attempts: 2,
    recipient: 'https://shop.example.com/hooks/orders',
    payload: { event: 'order.paid', orderId: 1042 },
    deliveredAt: minutesAgo(12),
    createdAt: minutesAgo(13),
  });
  addAttempt(db, delivered.id, { success: false, error: 'Webhook answered 502', durationMs: 310 });
  addAttempt(db, delivered.id, { success: true, error: null, durationMs: 95 });

  const dead = insertNotification(db, {
    status: 'DEAD_LETTERED',
    attempts: 3,
    recipient: 'https://legacy-erp.example.com/fail/notify',
    payload: { event: 'invoice.issued', invoiceId: 'INV-2291' },
    lastError: 'Webhook answered 503',
    createdAt: minutesAgo(30),
  });
  for (let i = 0; i < 3; i++) {
    addAttempt(db, dead.id, { success: false, error: 'Webhook answered 503', durationMs: 5000 });
  }

  const notFound = insertNotification(db, {
    status: 'DEAD_LETTERED',
    attempts: 1,
    recipient: 'https://partner.example.com/old-endpoint',
    payload: { event: 'customer.updated', customerId: 77 },
    lastError: 'Webhook answered 404',
    createdAt: minutesAgo(45),
  });
  addAttempt(db, notFound.id, { success: false, error: 'Webhook answered 404', durationMs: 120 });

  insertNotification(db, {
    status: 'PENDING',
    channel: 'EMAIL',
    recipient: 'ana@example.com',
    payload: { template: 'welcome', name: 'Ana' },
  });
}
