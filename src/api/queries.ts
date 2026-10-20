import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { CreateNotificationInput, NotificationStatus } from './types';

export const queryKeys = {
  all: ['notifications'] as const,
  list: (status: NotificationStatus) => ['notifications', 'list', status] as const,
  detail: (id: string) => ['notifications', 'detail', id] as const,
  attempts: (id: string) => ['notifications', 'attempts', id] as const,
};

/** Delivery state changes in the background, so views poll while the tab is visible. */
const POLL_MS = 5_000;

/** Statuses that will not change on their own (only a manual retry moves a dead letter). */
const SETTLED: NotificationStatus[] = ['DELIVERED', 'DEAD_LETTERED'];

export function useNotifications(status: NotificationStatus) {
  return useQuery({
    queryKey: queryKeys.list(status),
    queryFn: () => api.listByStatus(status),
    refetchInterval: POLL_MS,
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => api.get(id),
    refetchInterval: (query) =>
      query.state.data && SETTLED.includes(query.state.data.status) ? false : POLL_MS,
  });
}

export function useAttempts(id: string, status: NotificationStatus | undefined) {
  return useQuery({
    queryKey: queryKeys.attempts(id),
    queryFn: () => api.attempts(id),
    enabled: status !== undefined,
    refetchInterval: status && SETTLED.includes(status) ? false : POLL_MS,
  });
}

export function useRetry(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.retry(id),
    onSuccess: (notification) => {
      client.setQueryData(queryKeys.detail(id), notification);
      void client.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useCreateNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: CreateNotificationInput }) =>
      api.create(key, input),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.all }),
  });
}
