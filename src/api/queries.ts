import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { NotificationStatus } from './types';

export const queryKeys = {
  list: (status: NotificationStatus) => ['notifications', 'list', status] as const,
  detail: (id: string) => ['notifications', 'detail', id] as const,
  attempts: (id: string) => ['notifications', 'attempts', id] as const,
};

/** Delivery state changes in the background, so lists poll while the tab is visible. */
const POLL_MS = 5_000;

export function useNotifications(status: NotificationStatus) {
  return useQuery({
    queryKey: queryKeys.list(status),
    queryFn: () => api.listByStatus(status),
    refetchInterval: POLL_MS,
  });
}
