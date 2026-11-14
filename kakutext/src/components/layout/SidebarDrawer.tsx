import { useRef } from 'react';
import { Folder as FolderIcon, FolderPlus, Pin, Search, Star, X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import type { Folder, NoteSummary } from '@/stores/useAppStore';

export interface SidebarDrawerProps {
  isOpen: boolean;
  notes: NoteSummary[];
  folders: Folder[];
  activeNoteId: string | null;
  activeFolderId: string | null;
  onlyFavorites: boolean;
  searchQuery: string;
  isLoading: boolean;
  onClose: () => void;
  onSearchChange: (query: string) => void;
  onSelectFilter: (filter: { folderId: string | null; onlyFavorites: boolean }) => void;
  onSelectNote: (noteId: string) => void;
  onTogglePin: (noteId: string, nextPinned: boolean) => void;
  onToggleFavorite: (noteId: string, nextFavorited: boolean) => void;
  onOpenCreateFolder: () => void;
}

export function SidebarDrawer({
  isOpen,
  notes,
  folders,
  activeNoteId,
  activeFolderId,
  onlyFavorites,
  searchQuery,
  isLoading,
  onClose,
  onSearchChange,
  onSelectFilter,
  onSelectNote,
  onTogglePin,
  onToggleFavorite,
  onOpenCreateFolder,
}: SidebarDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const drawerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(drawerRef, !isDesktop && isOpen, onClose);

  const sidebarContent = (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3.5">
      <div className="flex items-center justify-between md:hidden">
        <span className="text-base font-black text-ink">Notes &amp; Folders</span>
        <IconButton aria-label="Close sidebar" variant="toolbar" onClick={onClose}>
          <X className="h-5 w-5" aria-hidden="true" />
        </IconButton>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <TextField
          label="Search notes"
          hideLabel
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notes..."
          className="pr-10"
        />
        <Search
          className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>

      {/* Quick Filters */}
      <nav aria-label="Note filters" className="space-y-1">
        <button
          type="button"
          onClick={() => {
            onSelectFilter({ folderId: null, onlyFavorites: false });
            if (!isDesktop) onClose();
          }}
          className={cn(
            'flex min-h-11 w-full cursor-pointer items-center justify-between rounded-card border-[1.5px] px-3 py-2 text-left text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
            activeFolderId === null && !onlyFavorites
              ? 'border-ink bg-tab-active text-ink shadow-soft'
              : 'border-transparent text-ink hover:bg-paper/60'
          )}
        >
          <span>All Notes</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectFilter({ folderId: null, onlyFavorites: true });
            if (!isDesktop) onClose();
          }}
          className={cn(
            'flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-card border-[1.5px] px-3 py-2 text-left text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
            onlyFavorites
              ? 'border-ink bg-tab-active text-ink shadow-soft'
              : 'border-transparent text-ink hover:bg-paper/60'
          )}
        >
          <Star className="h-4 w-4 text-accent-link" aria-hidden="true" />
          <span>Favorites</span>
        </button>
      </nav>

      {/* Folders Section */}
      <section aria-label="Folders" className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold tracking-wide text-muted uppercase">
            Folders
          </span>
          <IconButton
            aria-label="Create new folder"
            variant="toolbar"
            onClick={onOpenCreateFolder}
          >
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>

        {folders.length === 0 ? (
          <p className="px-2 text-xs text-muted">No folders yet.</p>
        ) : (
          <ul className="space-y-1">
            {folders.map((folder) => {
              const selected = activeFolderId === folder.id && !onlyFavorites;
              return (
                <li key={folder.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFilter({ folderId: folder.id, onlyFavorites: false });
                      if (!isDesktop) onClose();
                    }}
                    className={cn(
                      'flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-card border-[1.5px] px-3 py-2 text-left text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                      selected
                        ? 'border-ink bg-tab-active text-ink shadow-soft'
                        : 'border-transparent text-ink hover:bg-paper/60'
                    )}
                  >
                    <FolderIcon
                      className="h-4 w-4 shrink-0"
                      style={{ color: folder.color ?? 'var(--accent-link)' }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Notes List */}
      <section aria-label="Notes list" className="flex-1 space-y-2">
        <span className="block px-1 text-xs font-extrabold tracking-wide text-muted uppercase">
          Notes ({notes.length})
        </span>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-card border border-dashed border-(--border-dashed) bg-paper/70 p-3 text-xs text-muted">
            No notes in this view yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => {
              const isCurrent = note.id === activeNoteId;
              return (
                <li
                  key={note.id}
                  className={cn(
                    'flex items-center justify-between gap-1 rounded-card border-[1.5px] border-ink p-1.5 shadow-soft transition-colors',
                    isCurrent ? 'bg-tab-active' : 'bg-paper hover:bg-tab-active/60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectNote(note.id);
                      if (!isDesktop) onClose();
                    }}
                    className="min-h-11 flex-1 cursor-pointer truncate px-2 text-left text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {note.title.trim() || 'Untitled Note'}
                  </button>

                  <IconButton
                    aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                    variant="toolbar"
                    isActive={note.pinned}
                    onClick={() => onTogglePin(note.id, !note.pinned)}
                  >
                    <Pin className="h-4 w-4" aria-hidden="true" />
                  </IconButton>

                  <IconButton
                    aria-label={note.favorited ? 'Remove from favorites' : 'Add to favorites'}
                    variant="toolbar"
                    isActive={note.favorited}
                    onClick={() => onToggleFavorite(note.id, !note.favorited)}
                  >
                    <Star className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );

  // Desktop persistent sidebar
  if (isDesktop) {
    return (
      <aside
        aria-label="Workspace sidebar"
        className="w-72 shrink-0 rounded-paper border-[1.5px] border-ink bg-toolbar/85 shadow-paper"
      >
        {sidebarContent}
      </aside>
    );
  }

  // Mobile slide-over drawer
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex bg-ink/40 backdrop-blur-[1px] md:hidden"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notes navigation drawer"
        className="h-full w-80 max-w-[85vw] border-r-[1.5px] border-ink bg-toolbar shadow-paper"
      >
        {sidebarContent}
      </div>
    </div>
  );
}