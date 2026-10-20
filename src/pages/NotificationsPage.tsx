import { Link, useSearchParams } from 'react-router-dom';
import { useNotifications } from '../api/queries';
import { NOTIFICATION_STATUSES, type NotificationStatus } from '../api/types';
import { StatusTabs } from '../components/StatusTabs';
import { formatDateTime, shortId } from '../format';

function parseStatus(value: string | null): NotificationStatus {
  return NOTIFICATION_STATUSES.find((s) => s === value) ?? 'DEAD_LETTERED';
}

/** The selected status lives in the URL (?status=), so a filtered view can be shared. */
export function NotificationsPage() {
  const [params, setParams] = useSearchParams();
  const status = parseStatus(params.get('status'));
  const { data, isPending, isError, error } = useNotifications(status);

  return (
    <section>
      <StatusTabs value={status} onChange={(next) => setParams({ status: next })} />

      {isPending && <p className="muted">Loading…</p>}
      {isError && (
        <p role="alert" className="error">
          Could not load notifications: {error.message}
        </p>
      )}
      {data && data.length === 0 && <p className="muted">No notifications with this status.</p>}

      {data && data.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Channel</th>
              <th>Recipient</th>
              <th>Attempts</th>
              <th>Last error</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.map((n) => (
              <tr key={n.id}>
                <td>
                  <Link to={`/notifications/${n.id}`}>{shortId(n.id)}</Link>
                </td>
                <td>{n.channel}</td>
                <td className="truncate">{n.recipient}</td>
                <td>{n.attempts}</td>
                <td className="truncate">{n.lastError ?? '—'}</td>
                <td>{formatDateTime(n.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
