import { AlertCircle, Check, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { AutosaveStatus } from '@/stores/useAppStore';

export interface StatusBarProps {
  wordCount: number;
  characterCount: number;
  autosaveStatus: AutosaveStatus;
  lastSavedAt?: string;
  onRetrySave: () => void;
}

export function StatusBar({
  wordCount,
  characterCount,
  autosaveStatus,
  lastSavedAt,
  onRetrySave,
}: StatusBarProps) {
  const renderStatus = () => {
    switch (autosaveStatus) {
      case 'dirty':
        return <span className="text-muted">Unsaved changes...</span>;
      case 'saving':
        return (
          <span className="inline-flex items-center gap-1 text-ink">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Saving...
          </span>
        );
      case 'saved':
        return (
          <span
            title={lastSavedAt ? `Last saved ${lastSavedAt}` : undefined}
            className="inline-flex items-center gap-1 text-ink"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Auto-saved
          </span>
        );
      case 'conflict':
        return (
          <span className="inline-flex items-center gap-1 font-extrabold text-danger-text">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Version conflict
          </span>
        );
      case 'error':
        return (
          <button
            type="button"
            onClick={onRetrySave}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1 font-extrabold text-danger-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Save failed — Retry
          </button>
        );
      case 'idle':
      default:
        return <span className="text-muted">Ready</span>;
    }
  };

  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] border-ink bg-toolbar px-4 py-2 text-xs font-extrabold text-ink">
      <span>
        {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'} |{' '}
        {characterCount.toLocaleString()} {characterCount === 1 ? 'character' : 'characters'}
      </span>

      <Badge variant="accent">♥ quiet heart, kind soul ♥</Badge>

      <div aria-live="polite" className="min-w-24 text-right">
        {renderStatus()}
      </div>
    </footer>
  );
}