import { AutosaveBadge } from '@/components/editor/AutosaveBadge';
import { useProfile } from '@/hooks/useProfile';
import { useAppStore } from '@/stores/useAppStore';

export interface StatusBarProps {
  wordCount: number;
  characterCount: number;
  onRetryAutosave: () => void;
}

export function StatusBar({ wordCount, characterCount, onRetryAutosave }: StatusBarProps) {
  const { data: profile } = useProfile();
  const session = useAppStore((s) => s.session);

  const username =
    profile?.display_name?.trim() ||
    session?.user?.email?.split('@')[0] ||
    'User';

  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] border-ink bg-toolbar px-4 py-2 text-xs font-bold text-muted">
      <div aria-live="polite">
        {wordCount} {wordCount === 1 ? 'word' : 'words'} | {characterCount}{' '}
        {characterCount === 1 ? 'character' : 'characters'}
      </div>
      <div className="hidden text-ink sm:block">{username}&apos;s notes</div>
      <AutosaveBadge onRetry={onRetryAutosave} />
    </footer>
  );
}