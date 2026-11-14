import { useEffect, type ReactNode } from 'react';
import { queryClient } from '@/app/queryClient';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/useAppStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAppStore((s) => s.setSession);
  const resetOnSignOut = useAppStore((s) => s.resetOnSignOut);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isMounted) {
          setSession(data.session ?? null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        resetOnSignOut();
        return;
      }

      setSession(session ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, resetOnSignOut]);

  return <>{children}</>;
}