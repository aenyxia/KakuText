import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/queryClient';
import { EMPTY_TIPTAP_DOC } from '@/components/editor/TiptapConfig';
import type { Json, NoteRow } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useAppStore, type NoteSummary } from '@/stores/useAppStore';

export interface NotesFilterParams {
  folderId: string | null;
  onlyFavorites: boolean;
}

function sortNoteSummaries(notes: NoteSummary[]): NoteSummary[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export function useNotesList({ folderId, onlyFavorites }: NotesFilterParams) {
  return useQuery<NoteSummary[]>({
    queryKey: queryKeys.notes({ folderId, favorited: onlyFavorites }),
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select('id, title, content_text, pinned, favorited, folder_id, updated_at')
        .is('deleted_at', null)
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(50);

      if (onlyFavorites) {
        query = query.eq('favorited', true);
      } else if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as NoteSummary[];
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const onlyFavorites = useAppStore((s) => s.onlyFavorites);

  return useMutation({
    mutationFn: async (overrides?: { folderId?: string | null; favorited?: boolean }) => {
      const targetFolderId =
        overrides?.folderId !== undefined ? overrides.folderId : activeFolderId;
      const targetFavorited =
        overrides?.favorited !== undefined ? overrides.favorited : onlyFavorites;

      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: '',
          content_json: EMPTY_TIPTAP_DOC as unknown as Json,
          content_text: '',
          folder_id: targetFolderId,
          favorited: targetFavorited,
        })
        .select('*')
        .single();

      if (error || !data) {
        if (error?.message?.includes('note_quota_exceeded')) {
          throw new Error('You have reached the 5,000-note limit.');
        }
        throw new Error(error?.message || 'Could not create a new note.');
      }

      return data as NoteRow;
    },
    onSuccess: (created) => {
      queryClient.setQueryData(queryKeys.note(created.id), created);
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useTogglePinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({ pinned })
        .eq('id', id)
        .select('id, pinned, updated_at')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Could not update pin status.');
      }
      return data;
    },
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      await queryClient.cancelQueries({ queryKey: queryKeys.note(id) });

      const previousLists = queryClient.getQueriesData<NoteSummary[]>({ queryKey: ['notes'] });
      const previousNote = queryClient.getQueryData<NoteRow>(queryKeys.note(id));

      queryClient.setQueriesData<NoteSummary[]>({ queryKey: ['notes'] }, (old) => {
        if (!old) return old;
        return sortNoteSummaries(
          old.map((item) => (item.id === id ? { ...item, pinned } : item))
        );
      });

      queryClient.setQueryData<NoteRow>(queryKeys.note(id), (old) =>
        old ? { ...old, pinned } : old
      );

      return { previousLists, previousNote };
    },
    onError: (_err, { id }, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousNote) {
        queryClient.setQueryData(queryKeys.note(id), context.previousNote);
      }
    },
    onSettled: (_data, _err, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.note(id) });
    },
  });
}

export function useToggleFavoriteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, favorited }: { id: string; favorited: boolean }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({ favorited })
        .eq('id', id)
        .select('id, favorited, updated_at')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Could not update favorite status.');
      }
      return data;
    },
    onMutate: async ({ id, favorited }) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      await queryClient.cancelQueries({ queryKey: queryKeys.note(id) });

      const previousLists = queryClient.getQueriesData<NoteSummary[]>({ queryKey: ['notes'] });
      const previousNote = queryClient.getQueryData<NoteRow>(queryKeys.note(id));

      queryClient.setQueriesData<NoteSummary[]>({ queryKey: ['notes'] }, (old) => {
        if (!old) return old;
        return old.map((item) => (item.id === id ? { ...item, favorited } : item));
      });

      queryClient.setQueryData<NoteRow>(queryKeys.note(id), (old) =>
        old ? { ...old, favorited } : old
      );

      return { previousLists, previousNote };
    },
    onError: (_err, { id }, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousNote) {
        queryClient.setQueryData(queryKeys.note(id), context.previousNote);
      }
    },
    onSettled: (_data, _err, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.note(id) });
    },
  });
}

export function useMoveNoteToFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({ folder_id: folderId })
        .eq('id', id)
        .select('id, folder_id, updated_at')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Could not move note to folder.');
      }
      return data;
    },
    onMutate: async ({ id, folderId }) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      await queryClient.cancelQueries({ queryKey: queryKeys.note(id) });

      const previousLists = queryClient.getQueriesData<NoteSummary[]>({ queryKey: ['notes'] });
      const previousNote = queryClient.getQueryData<NoteRow>(queryKeys.note(id));

      queryClient.setQueriesData<NoteSummary[]>({ queryKey: ['notes'] }, (old) => {
        if (!old) return old;
        return old.map((item) => (item.id === id ? { ...item, folder_id: folderId } : item));
      });

      queryClient.setQueryData<NoteRow>(queryKeys.note(id), (old) =>
        old ? { ...old, folder_id: folderId } : old
      );

      return { previousLists, previousNote };
    },
    onError: (_err, { id }, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousNote) {
        queryClient.setQueryData(queryKeys.note(id), context.previousNote);
      }
    },
    onSettled: (_data, _err, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.note(id) });
    },
  });
}

export function useSoftDeleteNote() {
  const queryClient = useQueryClient();
  const closeTab = useAppStore((s) => s.closeTab);

  return useMutation({
    mutationFn: async (id: string) => {
      const deletedAt = new Date().toISOString();
      const { error } = await supabase
        .from('notes')
        .update({ deleted_at: deletedAt })
        .eq('id', id);

      if (error) {
        throw new Error(error.message || 'Could not delete note.');
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      const previousLists = queryClient.getQueriesData<NoteSummary[]>({ queryKey: ['notes'] });

      queryClient.setQueriesData<NoteSummary[]>({ queryKey: ['notes'] }, (old) => {
        if (!old) return old;
        return old.filter((item) => item.id !== id);
      });

      return { previousLists };
    },
    onSuccess: (deletedId) => {
      closeTab(deletedId);
      queryClient.removeQueries({ queryKey: queryKeys.note(deletedId) });
    },
    onError: (_err, _id, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}