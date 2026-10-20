import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../test/render';
import { db } from '../test/server';
import { SendNotificationPage } from './SendNotificationPage';

async function fillAndSend(recipient: string) {
  const recipientInput = screen.getByLabelText('Recipient');
  await userEvent.clear(recipientInput);
  await userEvent.type(recipientInput, recipient);
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));
}

describe('SendNotificationPage', () => {
  it('creates a notification and links to it', async () => {
    renderWithProviders(<SendNotificationPage />);

    await fillAndSend('https://example.com/hooks');

    expect(await screen.findByRole('status')).toHaveTextContent('Accepted and queued');
    expect(screen.getByRole('link', { name: 'Open notification' })).toBeInTheDocument();
    expect(db.notifications.size).toBe(1);
  });

  it('shows the replay message when the same key is sent twice', async () => {
    renderWithProviders(<SendNotificationPage />);

    await fillAndSend('https://example.com/hooks');
    await screen.findByRole('status');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText(/no duplicate/)).toBeInTheDocument();
    expect(db.notifications.size).toBe(1);
  });

  it('creates a second notification after generating a new key', async () => {
    renderWithProviders(<SendNotificationPage />);

    await fillAndSend('https://example.com/hooks');
    await screen.findByRole('status');
    await userEvent.click(screen.getByRole('button', { name: 'New key' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await screen.findByText('Accepted and queued for delivery.', { exact: false });
    expect(db.notifications.size).toBe(2);
  });

  it('rejects a payload that is not a JSON object before calling the API', async () => {
    renderWithProviders(<SendNotificationPage />);
    const payload = screen.getByLabelText('Payload (JSON)');
    await userEvent.clear(payload);
    await userEvent.type(payload, '"just text"');

    await fillAndSend('https://example.com/hooks');

    expect(screen.getByRole('alert')).toHaveTextContent('Payload must be a JSON object');
    expect(db.notifications.size).toBe(0);
  });

  it('shows the API validation error for a recipient in the wrong format', async () => {
    renderWithProviders(<SendNotificationPage />);
    await userEvent.selectOptions(screen.getByLabelText('Channel'), 'WHATSAPP');

    await fillAndSend('51999999999');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'not valid for the WHATSAPP channel',
    );
  });
});
