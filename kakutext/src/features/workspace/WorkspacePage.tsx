import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NoteTabsBar } from '@/components/layout/NoteTabsBar';
import { SidebarDrawer } from '@/components/layout/SidebarDrawer';
import { StatusBar } from '@/components/layout/StatusBar';
import { TopHeader } from '@/components/layout/TopHeader';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore, type Folder, type NoteSummary } from '@/stores/useAppStore';

const INITIAL_FOLDERS: Folder[] = [
  { id: 'folder-study', name: 'Study Notes', color: '#f4a84e' },
  { id: 'folder-plans', name: 'Project Plans', color: '#b3541e' },
];

const INITIAL_NOTES: NoteSummary[] = [
  {
    id: 'note-welcome',
    title: 'Document: Project Plan',
    pinned: true,
    favorited: true,
    folder_id: 'folder-plans',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'note-tasks',
    title: 'Lab1tasks & Study Checklist',
    pinned: false,
    favorited: false,
    folder_id: 'folder-study',
    updated_at: new Date().toISOString(),
  },
];

export function WorkspacePage() {
  const { id: routeNoteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDrawerOpen = useAppStore((s) => s.isDrawerOpen);
  const toggleDrawer = useAppStore((s) => s.toggleDrawer);
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen);
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const onlyFavorites = useAppStore((s) => s.onlyFavorites);
  const setFilter = useAppStore((s) => s.setFilter);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const openTabIds = useAppStore((s) => s.openTabIds);
  const openTab = useAppStore((s) => s.openTab);
  const closeTab = useAppStore((s) => s.closeTab);
  const autosaveStatus = useAppStore((s) => s.autosaveStatus);
  const setAutosaveStatus = useAppStore((s) => s.setAutosaveStatus);
  const mascotMood = useAppStore((s) => s.mascotMood);
  const setMascotMood = useAppStore((s) => s.setMascotMood);

  const [folders, setFolders] = useState<Folder[]>(INITIAL_FOLDERS);
  const [notes, setNotes] = useState<NoteSummary[]>(INITIAL_NOTES);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderError, setFolderError] = useState<string | undefined>(undefined);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const activeNote = notes.find((n) => n.id === routeNoteId) ?? null;

  const filteredNotes = notes.filter((n) => {
    if (onlyFavorites && !n.favorited) return false;
    if (activeFolderId && n.folder_id !== activeFolderId) return false;
    if (searchQuery.trim() && !n.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  const resolvedTabIds = openTabIds.length > 0 ? openTabIds : notes.map((n) => n.id);
  const openTabs = resolvedTabIds
    .map((id) => notes.find((n) => n.id === id))
    .filter((n): n is NoteSummary => Boolean(n))
    .map((n) => ({ id: n.id, title: n.title }));

  const handleSelectNote = (noteId: string) => {
    openTab(noteId);
    navigate(`/notes/${noteId}`);
  };

  const handleCreateNote = () => {
    const id = `note-${Date.now()}`;
    const created: NoteSummary = {
      id,
      title: 'New Cozy Note',
      pinned: false,
      favorited: false,
      folder_id: activeFolderId,
      updated_at: new Date().toISOString(),
    };
    setNotes((prev) => [created, ...prev]);
    openTab(id);
    setMascotMood('cheering');
    setAutosaveStatus('saved');
    navigate(`/notes/${id}`);
  };

  const handleCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setFolderError('Folder name must be 1–50 characters.');
      return;
    }
    const created: Folder = {
      id: `folder-${Date.now()}`,
      name: trimmed,
      color: '#f4a84e',
    };
    setFolders((prev) => [...prev, created]);
    setNewFolderName('');
    setFolderError(undefined);
    setIsFolderModalOpen(false);
    setMascotMood('cheering');
    showToast(`Created folder "${trimmed}"`, 'success');
  };

  return (
    <>
      <AppShell
        header={
          <TopHeader
            activeNoteTitle={activeNote?.title ?? 'Workspace'}
            isDrawerOpen={isDrawerOpen}
            theme={theme}
            hasActiveNote={Boolean(activeNote)}
            onToggleDrawer={toggleDrawer}
            onCreateNote={handleCreateNote}
            onExportMarkdown={() => showToast('Markdown export ready in Phase 4', 'info')}
            onExportText={() => showToast('Plain text export ready in Phase 4', 'info')}
            onToggleTheme={toggleTheme}
            onDeleteNote={() => setIsDeleteOpen(true)}
          />
        }
        sidebar={
          <SidebarDrawer
            isOpen={isDrawerOpen}
            notes={filteredNotes}
            folders={folders}
            activeNoteId={activeNote?.id ?? null}
            activeFolderId={activeFolderId}
            onlyFavorites={onlyFavorites}
            searchQuery={searchQuery}
            isLoading={false}
            onClose={() => setDrawerOpen(false)}
            onSearchChange={setSearchQuery}
            onSelectFilter={setFilter}
            onSelectNote={handleSelectNote}
            onTogglePin={(id, nextPinned) =>
              setNotes((prev) =>
                prev.map((n) => (n.id === id ? { ...n, pinned: nextPinned } : n))
              )
            }
            onToggleFavorite={(id, nextFavorited) =>
              setNotes((prev) =>
                prev.map((n) => (n.id === id ? { ...n, favorited: nextFavorited } : n))
              )
            }
            onOpenCreateFolder={() => setIsFolderModalOpen(true)}
          />
        }
        statusBar={
          <StatusBar
            wordCount={activeNote ? 42 : 0}
            characterCount={activeNote ? 268 : 0}
            autosaveStatus={autosaveStatus}
            onRetrySave={() => setAutosaveStatus('saved')}
          />
        }
      >
        <NoteTabsBar
          tabs={openTabs}
          activeTabId={activeNote?.id ?? null}
          onSelectTab={handleSelectNote}
          onCloseTab={(id) => {
            closeTab(id);
            if (activeNote?.id === id) navigate('/');
          }}
          onCreateTab={handleCreateNote}
        />

        <div className="flex flex-1 flex-col overflow-hidden rounded-t-paper border-[1.5px] border-ink bg-paper shadow-paper">
          <div className="flex items-center justify-between border-b-[1.5px] border-ink bg-toolbar px-4 py-2 text-xs font-extrabold text-ink">
            <span>Phase 1 Shell &amp; Routing Ready</span>
            <span>
              Supabase Env: {isSupabaseConfigured ? 'Configured ✓' : 'Placeholder (.env.local)'}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-3 sm:p-5">
            <div className="relative flex-1 rounded-card border-2 border-dashed border-(--border-dashed) bg-paper p-4 pb-32 sm:p-6 sm:pb-24">
              {activeNote ? (
                <div className="space-y-3">
                  <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                    {activeNote.title} ✨
                  </h1>
                  <p className="text-sm text-muted">
                    Route <code className="font-bold text-ink">/notes/{activeNote.id}</code> is
                    mounted inside <code className="font-bold text-ink">&lt;AppShell/&gt;</code>.
                    Tiptap rich-text editing and 1000ms autosave connect here in Phase 2.
                  </p>
                </div>
              ) : (
                <div className="flex h-full flex-col items-start justify-center gap-3">
                  <h1 className="text-2xl font-black tracking-tight text-ink">
                    Welcome to KakuText ✨
                  </h1>
                  <p className="max-w-md text-sm text-muted">
                    Select a note from the sidebar or tabs, or create a new cozy note to test
                    client-side routing and state management.
                  </p>
                  <Button onClick={handleCreateNote}>New Cozy Note</Button>
                </div>
              )}

              <div className="absolute right-3 bottom-3 sm:right-5 sm:bottom-4">
                <KakuMascot mood={mascotMood} size="lg" label={`Kaku mascot (${mascotMood})`} />
              </div>
            </div>
          </div>
        </div>
      </AppShell>

      <Dialog
        isOpen={isFolderModalOpen}
        title="Create Cozy Folder"
        description="Folders group your notes cleanly without deleting notes if removed."
        onClose={() => {
          setFolderError(undefined);
          setIsFolderModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <TextField
            label="Folder name"
            placeholder="e.g., Study Notes"
            value={newFolderName}
            error={folderError}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete this note?"
        description="This note will be moved out of your active workspace."
        confirmLabel="Delete Note"
        onConfirm={() => {
          if (activeNote) {
            setNotes((prev) => prev.filter((n) => n.id !== activeNote.id));
            closeTab(activeNote.id);
          }
          setIsDeleteOpen(false);
          setMascotMood('sleepy');
          showToast('Note deleted.', 'error');
          navigate('/');
        }}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
}