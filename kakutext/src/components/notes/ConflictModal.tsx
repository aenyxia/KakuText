import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

export interface ConflictModalProps {
  isOpen: boolean;
  localUpdatedAt: string;
  serverUpdatedAt: string;
  serverTitle?: string;
  onKeepLocal: () => void;
  onAcceptServer: () => void;
  isResolving?: boolean;
}

function formatTimestamp(isoString: string): string {
  try {
    return format(parseISO(isoString), 'MMM d, yyyy • h:mm:ss a');
  } catch {
    return isoString || 'Unknown time';
  }
}

export function ConflictModal({
  isOpen,
  localUpdatedAt,
  serverUpdatedAt,
  serverTitle,
  onKeepLocal,
  onAcceptServer,
  isResolving = false,
}: ConflictModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      title="Newer Version Found"
      description="This note was updated in another tab or device while you were editing."
      onClose={onAcceptServer}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-card border border-dashed border-(--border-dashed) bg-canvas/70 p-3">
          <KakuMascot mood="thinking" size="sm" />
          <div className="text-xs text-muted">
            <p className="flex items-center gap-1 font-extrabold text-ink">
              <AlertTriangle className="h-4 w-4 text-danger-text" aria-hidden="true" />
              Choose which version to keep:
            </p>
            <p className="mt-0.5">
              No changes were overwritten automatically so your edits remain safe.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-card border-[1.5px] border-ink bg-tab-active/70 p-3">
            <p className="text-xs font-extrabold uppercase text-muted">Your Local Draft</p>
            <p className="mt-1 text-xs font-bold text-ink">
              Base version: {formatTimestamp(localUpdatedAt)}
            </p>
          </div>

          <div className="rounded-card border-[1.5px] border-ink bg-toolbar/60 p-3">
            <p className="text-xs font-extrabold uppercase text-muted">Cloud Version</p>
            <p className="mt-1 text-xs font-bold text-ink">
              Saved: {formatTimestamp(serverUpdatedAt)}
            </p>
            {serverTitle !== undefined && (
              <p className="mt-1 truncate text-xs text-muted">
                Title: <span className="font-bold text-ink">{serverTitle || 'Untitled'}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            disabled={isResolving}
            onClick={onAcceptServer}
          >
            Load Server Version
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isResolving}
            onClick={onKeepLocal}
          >
            Keep My Version
          </Button>
        </div>
      </div>
    </Dialog>
  );
}