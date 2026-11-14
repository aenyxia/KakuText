import { formatDistanceToNow, parseISO } from 'date-fns';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { Skeleton } from '@/components/ui/Skeleton';
import type { SearchNoteResult } from '@/hooks/useSearchNotes';
import { cn } from '@/lib/cn';
import { sanitizeSearchSnippet } from '@/lib/sanitize';

export interface SearchResultsListProps {
  results: SearchNoteResult[];
  isLoading: boolean;
  isError: boolean;
  validationError: string | null;
  query: string;
  activeNoteId?: string;
  onSelectNote: (noteId: string) => void;
}

function formatRelativeDate(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

export function SearchResultsList({
  results,
  isLoading,
  isError,
  validationError,
  query,
  activeNoteId,
  onSelectNote,
}: SearchResultsListProps) {
  if (validationError) {
    return (
      <p
        role="alert"
        className="rounded-card border border-danger-text bg-danger/20 px-3 py-2.5 text-xs font-bold text-danger-text"
      >
        {validationError}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p
        role="alert"
        className="rounded-card border border-danger-text bg-danger/20 px-3 py-2.5 text-xs font-bold text-danger-text"
      >
        Could not complete search. Please try again.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-card border border-dashed border-(--border-dashed) bg-paper/70 px-3 py-6 text-center">
        <KakuMascot mood="thinking" size="sm" />
        <p className="mt-2 text-xs font-extrabold text-ink">
          No matches for &ldquo;{query}&rdquo;
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          Try a different keyword or switch back to All Notes.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2" aria-label="Search results">
      {results.map((item) => {
        const safeSnippet = sanitizeSearchSnippet(item.snippet);
        const displayTitle = item.title.trim() || 'Untitled Cozy Note';
        const isActive = item.id === activeNoteId;

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelectNote(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'w-full cursor-pointer rounded-card border-[1.5px] p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                isActive
                  ? 'border-ink bg-tab-active shadow-soft'
                  : 'border-line bg-paper hover:border-ink hover:bg-tab-active/50'
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="truncate text-sm font-extrabold text-ink">{displayTitle}</h3>
                <span className="shrink-0 text-[11px] font-bold text-muted">
                  {formatRelativeDate(item.updated_at)}
                </span>
              </div>

              {safeSnippet ? (
                <p
                  className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted [&_b]:rounded-xs [&_b]:bg-accent/55 [&_b]:px-1 [&_b]:font-extrabold [&_b]:text-ink [&_mark]:rounded-xs [&_mark]:bg-accent/55 [&_mark]:px-1 [&_mark]:font-extrabold [&_mark]:text-ink"
                  dangerouslySetInnerHTML={{ __html: safeSnippet }}
                />
              ) : (
                <p className="mt-1 text-xs text-muted">Matched note title</p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}