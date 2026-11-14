import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  notes: (filters: { folderId: string | null; favorited: boolean }) =>
    ['notes', filters] as const,
  note: (noteId: string) => ['note', noteId] as const,
  folders: ['folders'] as const,
  profile: ['profile'] as const,
  search: (debouncedQuery: string) => ['search', debouncedQuery] as const,
};

export function purgeServerCache() {
  queryClient.clear();
}