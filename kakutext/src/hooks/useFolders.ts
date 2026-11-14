import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/queryClient';
import type { FolderRow } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { createFolderSchema, updateFolderSchema } from '@/lib/validation';
import { useAppStore } from '@/stores/useAppStore';

function formatFolderMutationError(error: { code?: string; message?: string }): Error {
  if (error.code === '23505' || error.message?.includes('folders_owner_name_uq')) {
    return new Error('A folder with that name already exists.');
  }
  return new Error(error.message || 'Could not save folder changes.');
}

export function useFolders() {
  return useQuery<FolderRow[]>({
    queryKey: queryKeys.folders,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id, owner_id, name, color, created_at, updated_at')
        .order('name', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; color?: string | null }) => {
      const parsed = createFolderSchema.parse(input);
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: parsed.name,
          color: parsed.color ?? null,
        })
        .select('id, owner_id, name, color, created_at, updated_at')
        .single();

      if (error || !data) {
        throw formatFolderMutationError(error ?? {});
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; name?: string; color?: string | null }) => {
      const parsed = updateFolderSchema.parse({
        name: input.name,
        color: input.color,
      });

      const { data, error } = await supabase
        .from('folders')
        .update(parsed)
        .eq('id', input.id)
        .select('id, owner_id, name, color, created_at, updated_at')
        .single();

      if (error || !data) {
        throw formatFolderMutationError(error ?? {});
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const setFilter = useAppStore((s) => s.setFilter);

  return useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase.from('folders').delete().eq('id', folderId);
      if (error) {
        throw new Error(error.message || 'Could not delete folder.');
      }
      return folderId;
    },
    onSuccess: (deletedId) => {
      if (activeFolderId === deletedId) {
        setFilter({ folderId: null, onlyFavorites: false });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}