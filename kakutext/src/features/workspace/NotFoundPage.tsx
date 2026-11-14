import { Link } from 'react-router-dom';
import { KakuMascot } from '@/components/mascot/KakuMascot';

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4 text-ink">
      <div className="w-full max-w-md space-y-4 rounded-paper border-[1.5px] border-ink bg-paper p-6 text-center shadow-paper">
        <KakuMascot mood="sleepy" size="lg" label="Sleepy duckling on 404 page" />
        <h1 className="text-2xl font-black text-ink">404 — Page Not Found</h1>
        <p className="text-sm text-muted">
          This stationery page wandered off or does not exist.
        </p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-ink bg-accent px-5 py-2.5 text-sm font-bold text-accent-fg shadow-soft transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Back to Workspace
        </Link>
      </div>
    </div>
  );
}