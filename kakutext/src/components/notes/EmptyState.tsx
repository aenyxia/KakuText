import { FilePlus2 } from 'lucide-react';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  isCreating?: boolean;
  onCreateNote: () => void;
}

export function EmptyState({
  title = 'Your cozy stationery desk is ready',
  description = 'Start a fresh rich-text note with headings, checklists, and tables—automatically saved across your devices.',
  isCreating = false,
  onCreateNote,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-paper border-[1.5px] border-ink bg-paper px-6 py-12 text-center shadow-paper">
      <div className="flex max-w-md flex-col items-center space-y-4">
        <KakuMascot mood="happy" size="lg" label="Happy Kaku mascot welcoming you" />
        <h1 className="text-2xl font-black tracking-tight text-ink">{title}</h1>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
        <Button
          type="button"
          variant="primary"
          size="lg"
          isLoading={isCreating}
          onClick={onCreateNote}
        >
          <FilePlus2 className="h-5 w-5" aria-hidden="true" />
          <span>New Cozy Note</span>
        </Button>
      </div>
    </div>
  );
}