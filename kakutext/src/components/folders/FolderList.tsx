import { useState } from 'react';
import { Folder as FolderIcon, FolderPlus, Layers, Pencil, Star, Trash2 } from 'lucide-react';
import { FolderModal } from '@/components/folders/FolderModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  const handleSelectAll = () => {
    setFilter({ folderId: null, onlyFavorites: false });
    onFilterSelected?.();
  };

  const handleSelectFavorites = () => {
    setFilter({ folderId: null, onlyFavorites: true });
    onFilterSelected?.();
  };

  const handleSelectFolder = (folderId: string) => {
    setFilter({ folderId, onlyFavorites: false });
    onFilterSelected?.();
  };

  const handleOpenCreate = () => {
    setEditingFolder(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!folderToDelete) return;
    const deletedId = folderToDelete.id;
    await deleteFolder.mutateAsync(deletedId);
    if (activeFolderId === deletedId) {
      setFilter({ folderId: null, onlyFavorites: false });
    }
    setFolderToDelete(null);
  };

  const isAllActive = activeFolderId === null && !onlyFavorites;

  return (
    <nav
      aria-label="Note filters and folders"
      className="flex h-full min-h-0 flex-col"
    >
      {/* Fixed Quick Filters & Folders Section Header */}
      <div className="shrink-0 space-y-1">
        <button
          type="button"
          onClick={handleSelectAll}
          aria-current={isAllActive ? 'page' : undefined}
          className={cn(
            'flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-card border-[1.5px] px-3 py-2 text-left text-sm font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
            isAllActive
              ? 'border-ink bg-tab-active text-ink shadow-soft'
              : 'border-transparent text-ink hover:border-line hover:bg-paper/70'
          )}
        >
          <Layers className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <span className="truncate">All Notes</span>
        </button>

        <button
          type="button"
          onClick={handleSelectFavorites}
          aria-current={onlyFavorites ? 'page' : undefined}
          className={cn(
            'flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-card border-[1.5px] px-3 py-2 text-left text-sm font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
            onlyFavorites
              ? 'border-ink bg-tab-active text-ink shadow-soft'
              : 'border-transparent text-ink hover:border-line hover:bg-paper/70'
          )}
        >
          <Star className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="truncate">Favorites</span>
        </button>

        <div className="flex items-center justify-between pt-2 pb-1 pl-1">
          <span className="text-xs font-black tracking-wide text-muted uppercase">
            Folders ({folders.length})
          </span>
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Create new folder"
            onClick={handleOpenCreate}
          >
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {/* Scrollable Folders List */}
      <ul className="mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-0.5">
        {folders.length === 0 ? (
          <li className="rounded-card border border-dashed border-(--border-dashed) bg-paper/50 px-3 py-2.5 text-xs font-bold text-muted">
            No folders yet. Tap + to organize your notes.
          </li>
        ) : (
          folders.map((folder) => {
            const isSelected = activeFolderId === folder.id && !onlyFavorites;
            return (
              <li key={folder.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectFolder(folder.id)}
                  aria-current={isSelected ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-card border-[1.5px] px-3 py-2 text-left text-sm font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                    isSelected
                      ? 'border-ink bg-tab-active text-ink shadow-soft'
                      : 'border-transparent text-ink hover:border-line hover:bg-paper/70'
                  )}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-ink"
                    style={{ backgroundColor: folder.color ?? 'var(--accent-primary)' }}
                    aria-hidden="true"
                  />
                  <FolderIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  <span className="truncate">{folder.name}</span>
                </button>

                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Edit folder ${folder.name}`}
                  onClick={() => handleOpenEdit(folder)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </IconButton>

                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete folder ${folder.name}`}
                  onClick={() => setFolderToDelete(folder)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-danger-text" aria-hidden="true" />
                </IconButton>
              </li>
            );
          })
        )}
      </ul>

      <FolderModal
        isOpen={isModalOpen}
        editingFolder={editingFolder}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFolder(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(folderToDelete)}
        title={`Delete "${folderToDelete?.name ?? 'folder'}"?`}
        description="Notes inside this folder will not be deleted—they will remain available in All Notes."
        confirmLabel="Delete Folder"
        isLoading={deleteFolder.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setFolderToDelete(null)}
      />
    </nav>
  );
}