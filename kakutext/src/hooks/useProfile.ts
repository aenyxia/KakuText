import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/queryClient';
import type { Profile } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validation';
import { useAppStore, type ThemeMode } from '@/stores/useAppStore';

export function useProfile() {
  const session = useAppStore((s) => s.session);
  const setTheme = useAppStore((s) => s.setTheme);
  const userId = session?.user?.id;

  const query = useQuery<Profile | null>({
    queryKey: queryKeys.profile,
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, theme, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message || 'Could not load profile.');
      }
      return data;
    },
  });

  useEffect(() => {
    const remoteTheme = query.data?.theme;
    if (remoteTheme === 'light' || remoteTheme === 'dark') {
      setTheme(remoteTheme);
    }
  }, [query.data?.theme, setTheme]);

  return query;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const session = useAppStore((s) => s.session);
  const setTheme = useAppStore((s) => s.setTheme);
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: async (input: ProfileUpdateInput) => {
      if (!userId) {
        throw new Error('You must be signed in to update your profile.');
      }

      const parsed = profileUpdateSchema.parse(input);
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: parsed.display_name,
          theme: parsed.theme,
        })
        .eq('id', userId)
        .select('id, display_name, theme, created_at, updated_at')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Could not update profile.');
      }

      return data;
    },
    onSuccess: (updated) => {
      const nextTheme: ThemeMode = updated.theme === 'dark' ? 'dark' : 'light';
      setTheme(nextTheme);
      queryClient.setQueryData(queryKeys.profile, updated);
    },
  });
}