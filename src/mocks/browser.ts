import { getResponse, http } from 'msw';
import { setTransport } from '../api/client';
import { createDb } from './db';
import { createHandlers } from './handlers';
import { seed, tick } from './simulator';

/**
 * Static demo (GitHub Pages): requests are answered in-page by the same MSW handlers the tests
 * use, with simulated delivery. No service worker is needed, so it works in any browser that runs
 * the page. Everything lives in memory and resets on reload.
 */
export function startDemo(apiUrl: string): void {
  const db = createDb();
  const retried = new Set<string>();
  seed(db);

  const handlers = [
    // Retrying in the demo also "fixes" the receiver, so the retry visibly succeeds.
    http.post(`${apiUrl}/notifications/:id/retry`, ({ params }) => {
      retried.add(params.id as string);
    }),
    ...createHandlers(db, apiUrl),
  ];

  setTransport(async (input, init) => {
    const response = await getResponse(handlers, new Request(input, init));
    return response ?? Response.json({ message: 'Not found' }, { status: 404 });
  });

  setInterval(() => tick(db, retried), 2_000);
}
