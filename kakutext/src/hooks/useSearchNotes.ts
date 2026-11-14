import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { queryKeys } from '@/app/queryClient';
import { supabase } from '@/lib/supabase';
import { searchQuerySchema } from '@/lib/validation';
import { useAppStore } from '@/stores/useAppStore';

export interface SearchNoteResult {
  id: string;
  title: string;
  snippet: string;
  updated_at: string;
  rank: number;
}

export function useSearchNotes() {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const activeFolderId = useAppStore((s) => s.activeFolderId);

  const [debouncedRaw] = useDebounce(searchQuery, 300);
  const parsed = searchQuerySchema.safeParse({ q: debouncedRaw });
  const validQuery = parsed.success ? parsed.data.q : '';
  const isSearchActive = searchQuery.trim().length > 0;

  const query = useQuery<SearchNoteResult[]>({
    queryKey: [...queryKeys.search(validQuery), activeFolderId ?? 'all'],
    enabled: validQuery.length > 0,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_notes', {
        q: validQuery,
        lim: 30,
        folder: activeFolderId,
      });

      if (error) {
        throw new Error(error.message || 'Search failed.');
      }

      return (data ?? []) as SearchNoteResult[];
    },
  });

  return {
    ...query,
    rawQuery: searchQuery,
    debouncedQuery: validQuery,
    isSearchActive,
    validationError:
      isSearchActive && searchQuery.trim().length > 100
        ? 'Search query must be 100 characters or fewer.'
        : null,
  };
}