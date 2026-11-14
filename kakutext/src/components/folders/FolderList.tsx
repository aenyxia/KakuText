import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  FolderPlus,
  Layers,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { FolderModal } from '@/components/folders/FolderModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { useDeleteFolder } from '@/hooks/useFolders';
import { cn } from '@/lib/cn';
import { useAppStore, type Folder } from '@/stores/useAppStore';

export interface FolderListProps {
  folders: Folder[];
  onFilterSelected?: () => void;
}

export function FolderList({ folders, onFilterSelected }: FolderListProps) {
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const onlyFavorites = useAppStore((s) => s.onlyFavorites);
  const setFilter = useAppStore((s) => s.setFilter);

  const deleteFolder = useDeleteFolder();
  const { showToast } = useToast();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  const handleSelectFilter = (folderId: string | null, favorites: boolean) => {
    setFilter({ folderId, onlyFavorites: favorites });
    onFilterSelected?.();
  };

  const handleConfirmDelete = async () => {
    if (!deletingFolder) return;
    try {
      await deleteFolder.mutateAsync(deletingFolder.id);
      showToast(`Deleted "${deletingFolder.name}". Notes moved to All Notes.`, 'info');
      setDeletingFolder(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete folder.', 'error');
    }
  };

  const isAllNotesActive = !onlyFavorites && activeFolderId === null;

  return (
    <nav aria-label="Note filters and folders" className="space-y-2">
      <div className="space-y-1">
        <button
          type="button"
          aria-current={isAllNotesActive ? 'page' : undefined}
          onClick={() => handleSelectFilter(null, false)}
          className={cn(
            'flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-card border px-3 py-2 text-left text-sm font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
            isAllNotesActive
              ? 'border-ink bg-tab-active text-ink shadow-soft'
              : 'border-transparent text-ink hover:bg-tab-active/60'
          )}
        >
          <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">All Notes</span>
        </button>

        <button
          type="button"
          aria-current={onlyFavorites ? 'page' : undefined}
          onClick={() => handleSelectFilter(null, true)}
          className={cn(
            'flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-card border px-3 py-2 text-left text-sm font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
            onlyFavorites
              ? 'border-ink bg-tab-active text-ink shadow-soft'
              : 'border-transparent text-ink hover:bg-tab-active/60'
          )}
        >
          <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Favorites</span>
        </button>
      </div>

      <div className="border-t border-line/70 pt-2">
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex min-h-11 flex-1 cursor-pointer items-center gap-1.5 rounded-card px-2 text-left text-xs font-black tracking-wide text-muted uppercase hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>Folders ({folders.length})</span>
          </button>

          <IconButton
            type="button"
            size="sm"
            variant="toolbar"
            aria-label="Create new folder"
            onClick={() => {
              setEditingFolder(null);
              setIsModalOpen(true);
            }}
          >
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>

        {isExpanded && (
          <ul className="mt-1 space-y-1">
            {folders.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted">
                No folders yet. Tap + to create one.
              </li>
            ) : (
              folders.map((folder) => {
                const isSelected = !onlyFavorites && activeFolderId === folder.id;
                return (
                  <li key={folder.id} className="flex items-center gap-0.5">
                    <button
                      type="button"
                      aria-current={isSelected ? 'page' : undefined}
                      onClick={() => handleSelectFilter(folder.id, false)}
                      className={cn(
                        'flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-card border px-2.5 py-1.5 text-left text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                        isSelected
                          ? 'border-ink bg-tab-active font-extrabold text-ink shadow-soft'
                          : 'border-transparent text-ink hover:bg-tab-active/60'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full border border-ink/40"
                        style={{ backgroundColor: folder.color || 'var(--accent-primary)' }}
                      />
                      <FolderIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                      <span className="truncate">{folder.name}</span>
                    </button>

                    <IconButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Edit folder ${folder.name}`}
                      onClick={() => {
                        setEditingFolder(folder);
                        setIsModalOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconButton>

                    <IconButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete folder ${folder.name}`}
                      onClick={() => setDeletingFolder(folder)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger-text" aria-hidden="true" />
                    </IconButton>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      <FolderModal
        isOpen={isModalOpen}
        editingFolder={editingFolder}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFolder(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingFolder)}
        title={`Delete "${deletingFolder?.name ?? 'folder'}"?`}
        description="Deleting this folder will not delete your notes—they will remain safe in All Notes."
        confirmLabel="Delete Folder"
        isLoading={deleteFolder.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingFolder(null)}
      />
    </nav>
  );
}