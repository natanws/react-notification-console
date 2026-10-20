import { NOTIFICATION_STATUSES, type NotificationStatus } from '../api/types';
import { statusLabel } from './statusLabels';

interface Props {
  value: NotificationStatus;
  onChange: (status: NotificationStatus) => void;
}

export function StatusTabs({ value, onChange }: Props) {
  return (
    <div role="tablist" aria-label="Filter by status" className="tabs">
      {NOTIFICATION_STATUSES.map((status) => (
        <button
          key={status}
          role="tab"
          type="button"
          aria-selected={status === value}
          className={status === value ? 'tab tab--active' : 'tab'}
          onClick={() => onChange(status)}
        >
          {statusLabel(status)}
        </button>
      ))}
    </div>
  );
}
