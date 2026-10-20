import { setupServer } from 'msw/node';
import { createDb } from '../mocks/db';
import { createHandlers } from '../mocks/handlers';

export const TEST_API_URL = 'http://localhost:3000';

/** Shared mock database; tests seed it and the setup file clears it after each test. */
export const db = createDb();

export const server = setupServer(...createHandlers(db, TEST_API_URL));

export function resetDb(): void {
  db.notifications.clear();
  db.attempts.clear();
  db.idempotency.clear();
}
