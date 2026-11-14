import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { useAppStore } from '@/stores/useAppStore';

export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useAppStore((s) => s.session);
  const authReady = useAppStore((s) => s.authReady);
  const location = useLocation();

  if (!authReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-4 text-ink"
      >
        <KakuMascot mood="thinking" size="lg" />
        <p className="text-sm font-extrabold text-muted">Checking your cozy desk...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}