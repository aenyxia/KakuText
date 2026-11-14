import { AutosaveBadge } from '@/components/editor/AutosaveBadge';

export interface StatusBarProps {
  wordCount: number;
  characterCount: number;
  onRetryAutosave: () => void;
}

export function StatusBar({ wordCount, characterCount, onRetryAutosave }: StatusBarProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] border-ink bg-toolbar px-4 py-2 text-xs font-bold text-muted">
      <div aria-live="polite">
        {wordCount} {wordCount === 1 ? 'word' : 'words'} | {characterCount}{' '}
        {characterCount === 1 ? 'character' : 'characters'}
      </div>
      <div className="hidden text-ink sm:block">quiet heart, kind soul</div>
      <AutosaveBadge onRetry={onRetryAutosave} />
    </footer>
  );
}