/** Mirrors the public API of nest-notification-hub. */

export const NOTIFICATION_STATUSES = [
  'PENDING',
  'PROCESSING',
  'DELIVERED',
  'FAILED',
  'DEAD_LETTERED',
] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const CHANNELS = ['WEBHOOK', 'EMAIL', 'WHATSAPP'] as const;

export type Channel = (typeof CHANNELS)[number];

export interface Notification {
  id: string;
  channel: Channel;
  recipient: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  attempts: number;
  lastError: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAttempt {
  id: string;
  notificationId: string;
  attempt: number;
  success: boolean;
  error: string | null;
  durationMs: number;
  createdAt: string;
}

export interface CreateNotificationInput {
  channel: Channel;
  recipient: string;
  payload: Record<string, unknown>;
}
