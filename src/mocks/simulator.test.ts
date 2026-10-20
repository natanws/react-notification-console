import { describe, expect, it } from 'vitest';
import { createDb, insertNotification } from './db';
import { seed, tick } from './simulator';

describe('demo simulator', () => {
  it('delivers a healthy notification in two ticks', () => {
    const db = createDb();
    const n = insertNotification(db, { recipient: 'https://ok.example.com' });

    tick(db, new Set());
    expect(db.notifications.get(n.id)?.status).toBe('PROCESSING');
    tick(db, new Set());

    expect(db.notifications.get(n.id)).toMatchObject({ status: 'DELIVERED', attempts: 1 });
    expect(db.attempts.get(n.id)).toHaveLength(1);
  });

  it('dead-letters a broken receiver after three failed attempts', () => {
    const db = createDb();
    const n = insertNotification(db, { recipient: 'https://x.example.com/fail' });

    for (let i = 0; i < 6; i++) tick(db, new Set());

    expect(db.notifications.get(n.id)).toMatchObject({ status: 'DEAD_LETTERED', attempts: 3 });
  });

  it('delivers a retried notification even if the receiver used to fail', () => {
    const db = createDb();
    const n = insertNotification(db, { recipient: 'https://x.example.com/fail' });

    tick(db, new Set([n.id]));
    tick(db, new Set([n.id]));

    expect(db.notifications.get(n.id)?.status).toBe('DELIVERED');
  });

  it('seeds every screen with data', () => {
    const db = createDb();
    seed(db);

    const statuses = new Set([...db.notifications.values()].map((n) => n.status));
    expect(statuses).toEqual(new Set(['DELIVERED', 'DEAD_LETTERED', 'PENDING']));
  });
});
