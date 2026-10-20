import type { NotificationStatus } from '../api/types';
import { statusLabel } from './statusLabels';

export function StatusBadge({ status }: { status: NotificationStatus }) {
  return <span className={`badge badge--${status.toLowerCase()}`}>{statusLabel(status)}</span>;
}
