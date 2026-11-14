import { useMemo, useRef, useState } from 'react';
import { FilePlus2, X } from 'lucide-react';
import { FolderList } from '@/components/folders/FolderList';
import { NoteCard } from '@/components/notes/NoteCard';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResultsList } from '@/components/search/SearchResultsList';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useFolders } from '@/hooks/useFolders';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  useNotesList,
  useSoftDeleteNote,
  useToggleFavoriteNote,
  useTogglePinNote,
} from '@/hooks/useNotes';
import { useSearchNotes } from '@/hooks/useSearchNotes';
import { useAppStore, type NoteSummary } from '@/stores/useAppStore';

export interface SidebarDrawerProps {
  activeNoteId?: string;
  isCreatingNote?: boolean;
  onCreateNote: () => void;
  onSelectNote: (noteId: string) => void;
  onNoteDeleted?: (deletedNoteId: string) => void;
}

export function SidebarDrawer({
  activeNoteId,
  isCreatingNote = false,
  onCreateNote,
  onSelectNote,
  onNoteDeleted,
}: SidebarDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isDrawerOpen = useAppStore((s) => s.isDrawerOpen);
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen);
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const onlyFavorites = useAppStore((s) => s.onlyFavorites);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<NoteSummary | null>(null);
  const { showToast } = useToast();

  useFocusTrap(drawerRef, !isDesktop && isDrawerOpen, () => setDrawerOpen(false));

  const { data: folders = [] } = useFolders();
  const { data: notes = [], isLoading: isNotesLoading } = useNotesList({
    folderId: activeFolderId,
    onlyFavorites,
  });

  const {
    data: searchResults = [],
    isLoading: isSearchLoading,
    isError: isSearchError,
    debouncedQuery,
    isSearchActive,
    validationError: searchValidationError,
  } = useSearchNotes();

  const togglePin = useTogglePinNote();
  const toggleFavorite = useToggleFavoriteNote();
  const softDeleteNote = useSoftDeleteNote();

  const foldersById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders]
  );

  const activeFolderName = activeFolderId ? foldersById.get(activeFolderId)?.name : undefined;

  const activeHeading = useMemo(() => {
    if (isSearchActive) {
      return `Search Results (${searchResults.length})`;
    }
    if (onlyFavorites) return `Favorite Notes (${notes.length})`;
    if (activeFolderId) {
      return `${activeFolderName ?? 'Folder Notes'} (${notes.length})`;
    }
    return `All Notes (${notes.length})`;
  }, [
    isSearchActive,
    searchResults.length,
    onlyFavorites,
    activeFolderId,
    activeFolderName,
    notes.length,
  ]);

  const handleConfirmDeleteNote = async () => {
    if (!noteToDelete) return;
    const deletedId = noteToDelete.id;
    try {
      await softDeleteNote.mutateAsync(deletedId);
      setNoteToDelete(null);
      showToast('Note moved to trash.', 'info');
      onNoteDeleted?.(deletedId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete note.', 'error');
    }
  };

  const sidebarBody = (
    <div className="flex h-full min-h-0 flex-col gap-3.5 p-3.5">
        <div className="relative flex shrink-0 flex-col items-center justify-center gap-1 border-b border-line/70 pb-3">
        <img
          src="/logo.svg"
          alt="KakuText"
          className="h-14 w-50 shrink-0 object-contain"
        />

        {!isDesktop && (
          <IconButton
            type="button"
            variant="default"
            size="sm"
            aria-label="Close navigation drawer"
            onClick={() => setDrawerOpen(false)}
            className="absolute top-0 right-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2">
        
        <Button
          type="button"
          variant="primary"
          size="md"
          isLoading={isCreatingNote}
          onClick={() => {
            if (!isDesktop) setDrawerOpen(false);
            onCreateNote();
          }}
          className="flex-1"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          <span>New Cozy Note</span>
        </Button>

        {!isDesktop && (
          <IconButton
            type="button"
            variant="default"
            size="sm"
            aria-label="Close navigation drawer"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        )}
      </div>

      <div className="shrink-0">
        <SearchBar scopeLabel={activeFolderName} />
      </div>

      <div className="shrink-0">
        <FolderList
          folders={folders}
          onFilterSelected={() => {
            if (!isDesktop) setDrawerOpen(false);
          }}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-line/70 pt-3">
        <div className="mb-2 flex shrink-0 items-center justify-between px-1">
          <h2 className="text-xs font-black tracking-wide text-muted uppercase">
            {activeHeading}
          </h2>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
          {isSearchActive ? (
            <SearchResultsList
              results={searchResults}
              isLoading={isSearchLoading}
              isError={isSearchError}
              validationError={searchValidationError}
              query={debouncedQuery || useAppStore.getState().searchQuery.trim()}
              activeNoteId={activeNoteId}
              onSelectNote={(id) => {
                if (!isDesktop) setDrawerOpen(false);
                onSelectNote(id);
              }}
            />
          ) : isNotesLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : notes.length === 0 ? (
            <p className="rounded-card border border-dashed border-(--border-dashed) bg-paper/60 px-3 py-4 text-center text-xs font-bold text-muted">
              No notes in this view yet.
            </p>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                folder={note.folder_id ? foldersById.get(note.folder_id) : undefined}
                isActive={note.id === activeNoteId}
                onSelect={(id) => {
                  if (!isDesktop) setDrawerOpen(false);
                  onSelectNote(id);
                }}
                onTogglePin={(id, pinned) => togglePin.mutate({ id, pinned })}
                onToggleFavorite={(id, favorited) => toggleFavorite.mutate({ id, favorited })}
                onRequestDelete={(target) => setNoteToDelete(target)}
              />
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(noteToDelete)}
        title={`Delete "${noteToDelete?.title.trim() || 'Untitled Cozy Note'}"?`}
        description="This note will be removed from your active workspace."
        confirmLabel="Delete Note"
        isLoading={softDeleteNote.isPending}
        onConfirm={handleConfirmDeleteNote}
        onClose={() => setNoteToDelete(null)}
      />
    </div>
  );

  if (isDesktop) {
    return (
      <aside
        aria-label="Workspace sidebar"
        className="flex h-full min-h-0 w-72 shrink-0 flex-col overflow-hidden rounded-paper border-[1.5px] border-ink bg-toolbar/80 shadow-paper lg:w-80"
      >
        {sidebarBody}
      </aside>
    );
  }

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex md:hidden">
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className="fixed inset-0 bg-ink/40 backdrop-blur-[1px]"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notes and folders navigation"
        className="relative z-10 flex h-full w-80 max-w-[88vw] flex-col border-r-[1.5px] border-ink bg-toolbar shadow-paper"
      >
        {sidebarBody}
      </div>
    </div>
  );
}