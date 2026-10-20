import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCreateNotification } from '../api/queries';
import { CHANNELS, type Channel } from '../api/types';

const PLACEHOLDERS: Record<Channel, string> = {
  WEBHOOK: 'https://example.com/hooks/orders',
  EMAIL: 'ana@example.com',
  WHATSAPP: '+5551999999999',
};

const newKey = () => `console-${crypto.randomUUID()}`;

function parsePayload(text: string): Record<string, unknown> | string {
  try {
    const value: unknown = JSON.parse(text);
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return 'Payload must be a JSON object';
    }
    return value as Record<string, unknown>;
  } catch {
    return 'Payload is not valid JSON';
  }
}

/**
 * Sends a test notification. The idempotency key is kept between submits on purpose: submitting
 * twice shows the API's replay behavior instead of creating a duplicate.
 */
export function SendNotificationPage() {
  const [channel, setChannel] = useState<Channel>('WEBHOOK');
  const [recipient, setRecipient] = useState('');
  const [payloadText, setPayloadText] = useState('{\n  "orderId": 42\n}');
  const [key, setKey] = useState(newKey);
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const create = useCreateNotification();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = parsePayload(payloadText);
    if (typeof payload === 'string') {
      setPayloadError(payload);
      return;
    }
    setPayloadError(null);
    create.mutate({ key, input: { channel, recipient, payload } });
  }

  return (
    <section>
      <h1>Send a test notification</h1>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Channel
          <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Recipient
          <input
            required
            value={recipient}
            placeholder={PLACEHOLDERS[channel]}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </label>

        <label>
          Payload (JSON)
          <textarea
            rows={6}
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            aria-invalid={payloadError !== null}
          />
        </label>
        {payloadError && (
          <p role="alert" className="error">
            {payloadError}
          </p>
        )}

        <label>
          Idempotency-Key
          <span className="row">
            <input value={key} onChange={(e) => setKey(e.target.value)} />
            <button type="button" className="button button--ghost" onClick={() => setKey(newKey())}>
              New key
            </button>
          </span>
        </label>

        <button type="submit" className="button" disabled={create.isPending}>
          {create.isPending ? 'Sending…' : 'Send'}
        </button>
      </form>

      {create.isError && (
        <p role="alert" className="error">
          {create.error.message}
        </p>
      )}
      {create.data && (
        <p role="status" className="callout">
          {create.data.replayed
            ? 'Same key and body as before: the API returned the existing notification (no duplicate).'
            : 'Accepted and queued for delivery.'}{' '}
          <Link to={`/notifications/${create.data.notification.id}`}>Open notification</Link>
        </p>
      )}
    </section>
  );
}
