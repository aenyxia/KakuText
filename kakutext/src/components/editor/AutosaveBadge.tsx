import { AlertCircle, Check, Clock, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/stores/useAppStore';

export interface AutosaveBadgeProps {
  onRetry?: () => void;
}

export function AutosaveBadge({ onRetry }: AutosaveBadgeProps) {
  const autosaveStatus = useAppStore((s) => s.autosaveStatus);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-extrabold transition-colors',
        autosaveStatus === 'saved' && 'border-line bg-tab-active text-ink',
        autosaveStatus === 'idle' && 'border-line bg-paper text-muted',
        autosaveStatus === 'dirty' && 'border-line bg-paper text-muted',
        autosaveStatus === 'saving' && 'border-ink bg-accent/30 text-ink',
        (autosaveStatus === 'error' || autosaveStatus === 'conflict') &&
          'border-danger-text bg-danger/25 text-danger-text'
      )}
    >
      {autosaveStatus === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          <span>Saving...</span>
        </>
      )}

      {autosaveStatus === 'dirty' && (
        <>
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Unsaved changes</span>
        </>
      )}

      {autosaveStatus === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Saved</span>
        </>
      )}

      {autosaveStatus === 'idle' && <span>Ready</span>}

      {autosaveStatus === 'conflict' && (
        <>
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Conflict</span>
        </>
      )}

      {autosaveStatus === 'error' && (
        <>
          <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Offline / Save failed</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 underline hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}