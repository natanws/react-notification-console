import { Link, useParams } from 'react-router-dom';
import { useAttempts, useNotification, useRetry } from '../api/queries';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime } from '../format';

export function NotificationDetailPage() {
  const { id = '' } = useParams();
  const notification = useNotification(id);
  const attempts = useAttempts(id, notification.data?.status);
  const retry = useRetry(id);

  if (notification.isPending) return <p className="muted">Loading…</p>;
  if (notification.isError) {
    return (
      <section>
        <p role="alert" className="error">
          {notification.error.message}
        </p>
        <Link to="/">Back to notifications</Link>
      </section>
    );
  }

  const n = notification.data;

  return (
    <section className="detail">
      <Link to={`/?status=${n.status}`}>← Back</Link>

      <div className="detail__title">
        <h1>
          {n.channel} notification <code>{n.id}</code>
        </h1>
        <StatusBadge status={n.status} />
      </div>

      {n.status === 'DEAD_LETTERED' && (
        <div className="callout">
          <p>
            Delivery stopped after {n.attempts} attempt(s). Fix the receiver, then send it through
            the queue again.
          </p>
          <button
            type="button"
            className="button"
            disabled={retry.isPending}
            onClick={() => retry.mutate()}
          >
            {retry.isPending ? 'Retrying…' : 'Retry delivery'}
          </button>
          {retry.isError && (
            <p role="alert" className="error">
              {retry.error.message}
            </p>
          )}
        </div>
      )}

      <dl className="facts">
        <dt>Recipient</dt>
        <dd>{n.recipient}</dd>
        <dt>Attempts</dt>
        <dd>{n.attempts}</dd>
        <dt>Last error</dt>
        <dd>{n.lastError ?? '—'}</dd>
        <dt>Created</dt>
        <dd>{formatDateTime(n.createdAt)}</dd>
        <dt>Delivered</dt>
        <dd>{n.deliveredAt ? formatDateTime(n.deliveredAt) : '—'}</dd>
      </dl>

      <h2>Payload</h2>
      <pre className="code">{JSON.stringify(n.payload, null, 2)}</pre>

      <h2>Delivery attempts</h2>
      {attempts.data?.length === 0 && <p className="muted">No attempts yet.</p>}
      {attempts.data && attempts.data.length > 0 && (
        <ol className="timeline" aria-label="Delivery attempts">
          {attempts.data.map((a) => (
            <li key={a.id} className={a.success ? 'timeline__ok' : 'timeline__fail'}>
              <strong>
                #{a.attempt} {a.success ? 'delivered' : 'failed'}
              </strong>{' '}
              <span className="muted">
                {formatDateTime(a.createdAt)} · {a.durationMs} ms
              </span>
              {a.error && <div className="error">{a.error}</div>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
