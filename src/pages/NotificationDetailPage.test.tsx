import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { addAttempt, insertNotification } from '../mocks/db';
import { renderWithProviders } from '../test/render';
import { db, server, TEST_API_URL } from '../test/server';
import { NotificationDetailPage } from './NotificationDetailPage';

function renderAt(id: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/notifications/:id" element={<NotificationDetailPage />} />
    </Routes>,
    { route: `/notifications/${id}` },
  );
}

describe('NotificationDetailPage', () => {
  it('shows the payload and every delivery attempt in order', async () => {
    const n = insertNotification(db, {
      status: 'DELIVERED',
      attempts: 2,
      payload: { orderId: 42 },
    });
    addAttempt(db, n.id, { success: false, error: 'Webhook answered 503', durationMs: 120 });
    addAttempt(db, n.id, { success: true, error: null, durationMs: 80 });

    renderAt(n.id);

    const timeline = await screen.findByRole('list', { name: 'Delivery attempts' });
    const items = within(timeline).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('#1 failed');
    expect(items[0]).toHaveTextContent('Webhook answered 503');
    expect(items[1]).toHaveTextContent('#2 delivered');
    expect(screen.getByText(/"orderId": 42/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry delivery' })).not.toBeInTheDocument();
  });

  it('retries a dead letter and shows the new status', async () => {
    const n = insertNotification(db, {
      status: 'DEAD_LETTERED',
      attempts: 5,
      lastError: 'Webhook answered 500',
    });

    renderAt(n.id);
    await userEvent.click(await screen.findByRole('button', { name: 'Retry delivery' }));

    expect(await screen.findByText('Pending')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry delivery' })).not.toBeInTheDocument();
  });

  it('shows the API error when the retry is refused', async () => {
    const n = insertNotification(db, { status: 'DEAD_LETTERED' });
    server.use(
      http.post(`${TEST_API_URL}/notifications/:id/retry`, () =>
        HttpResponse.json(
          { message: 'Only dead-lettered notifications can be retried' },
          { status: 409 },
        ),
      ),
    );

    renderAt(n.id);
    await userEvent.click(await screen.findByRole('button', { name: 'Retry delivery' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only dead-lettered notifications can be retried',
    );
  });

  it('shows a not-found message for an unknown id', async () => {
    renderAt('00000000-0000-4000-8000-999999999999');

    expect(await screen.findByRole('alert')).toHaveTextContent('not found');
  });
});
