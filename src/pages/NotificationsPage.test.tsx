import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { insertNotification } from '../mocks/db';
import { renderWithProviders } from '../test/render';
import { db, server, TEST_API_URL } from '../test/server';
import { NotificationsPage } from './NotificationsPage';

describe('NotificationsPage', () => {
  it('shows dead letters by default', async () => {
    insertNotification(db, {
      status: 'DEAD_LETTERED',
      attempts: 5,
      lastError: 'Webhook answered 500',
    });
    insertNotification(db, { status: 'DELIVERED' });

    renderWithProviders(<NotificationsPage />);

    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(2); // header + 1 dead letter
    expect(within(rows[1]).getByText('Webhook answered 500')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Dead letter' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('switches status through the tabs', async () => {
    insertNotification(db, { status: 'DELIVERED', recipient: 'https://shop.test/hook' });
    renderWithProviders(<NotificationsPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Delivered' }));

    expect(await screen.findByText('https://shop.test/hook')).toBeInTheDocument();
  });

  it('reads the initial status from the URL', async () => {
    insertNotification(db, { status: 'PENDING', recipient: 'ana@example.com', channel: 'EMAIL' });

    renderWithProviders(<NotificationsPage />, { route: '/?status=PENDING' });

    expect(await screen.findByText('ana@example.com')).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    renderWithProviders(<NotificationsPage />);

    expect(await screen.findByText('No notifications with this status.')).toBeInTheDocument();
  });

  it('shows the API error message when the request fails', async () => {
    server.use(
      http.get(`${TEST_API_URL}/notifications`, () =>
        HttpResponse.json({ message: 'database unavailable' }, { status: 503 }),
      ),
    );

    renderWithProviders(<NotificationsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('database unavailable');
  });
});
