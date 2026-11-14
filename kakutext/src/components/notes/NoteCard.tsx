import { Pin, Star, Trash2 } from 'lucide-react';
import { KakuMascot, type MascotMood } from '@/components/mascot/KakuMascot';
import { cn } from '@/lib/cn';
import type { Folder, NoteSummary } from '@/stores/useAppStore';

export interface NoteCardProps {
  note: NoteSummary;
  folder?: Folder;
  isActive: boolean;
  onSelect: (id: string) => void;
  onTogglePin: (id: string, nextPinned: boolean) => void;
  onToggleFavorite: (id: string, nextFavorited: boolean) => void;
  onRequestDelete?: (note: NoteSummary) => void;
}

const CARD_MOODS: MascotMood[] = ['happy', 'thinking', 'sleepy', 'cheering'];

function getNoteCardMood(note: NoteSummary): MascotMood {
  if (note.pinned) return 'cheering';
  if (note.favorited) return 'happy';

  let hash = 0;
  for (let i = 0; i < note.id.length; i += 1) {
    hash = (hash * 31 + note.id.charCodeAt(i)) >>> 0;
  }
  return CARD_MOODS[hash % CARD_MOODS.length] ?? 'happy';
}

function formatRelativeTime(isoString: string): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function NoteCard({
  note,
  folder,
  isActive,
  onSelect,
  onTogglePin,
  onToggleFavorite,
  onRequestDelete,
}: NoteCardProps) {
  const mood = getNoteCardMood(note);
  const displayTitle = note.title.trim() || 'Untitled Cozy Note';

  return (
    <article
      className={cn(
        'group relative flex items-center gap-2 rounded-card border-[1.5px] p-2 transition-colors',
        isActive
          ? 'border-ink bg-tab-active shadow-soft'
          : 'border-line bg-paper hover:border-ink/70 hover:bg-tab-active/50'
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(note.id)}
        aria-current={isActive ? 'page' : undefined}
        className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-card text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-line bg-canvas/80 p-0.5"
        >
          <KakuMascot mood={mood} size="sm" className="h-8 w-8" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-ink">{displayTitle}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-muted">
            <span>{formatRelativeTime(note.updated_at)}</span>
            {folder && (
              <span className="inline-flex max-w-24 items-center gap-1 truncate rounded-pill border border-line bg-toolbar px-1.5 py-0.2 text-[10px] font-extrabold text-ink">
                {folder.color && (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: folder.color }}
                  />
                )}
                <span className="truncate">{folder.name}</span>
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          aria-pressed={note.pinned}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note.id, !note.pinned);
          }}
          className={cn(
            'inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-card transition-colors hover:bg-toolbar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
            note.pinned ? 'text-ink' : 'text-muted hover:text-ink'
          )}
        >
          <Pin
            className={cn('h-4 w-4', note.pinned && 'fill-accent text-ink')}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          aria-label={note.favorited ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={note.favorited}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(note.id, !note.favorited);
          }}
          className={cn(
            'inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-card transition-colors hover:bg-toolbar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
            note.favorited ? 'text-ink' : 'text-muted hover:text-ink'
          )}
        >
          <Star
            className={cn('h-4 w-4', note.favorited && 'fill-accent text-ink')}
            aria-hidden="true"
          />
        </button>

        {onRequestDelete && (
          <button
            type="button"
            aria-label={`Delete ${displayTitle}`}
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(note);
            }}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-card text-muted transition-colors hover:bg-toolbar hover:text-danger-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Trash2 className="h-4 w-4 text-danger-text" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}