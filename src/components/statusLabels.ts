import type { NotificationStatus } from '../api/types';

const LABELS: Record<NotificationStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  DELIVERED: 'Delivered',
  FAILED: 'Retrying',
  DEAD_LETTERED: 'Dead letter',
};

export function statusLabel(status: NotificationStatus): string {
  return LABELS[status];
}
