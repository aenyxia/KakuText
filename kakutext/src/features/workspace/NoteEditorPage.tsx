import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEditor } from '@tiptap/react';
import {
  Folder as FolderIcon,
  Menu,
  Moon,
  Pin,
  Plus,
  Settings,
  Star,
  Sun,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { queryKeys } from '@/app/queryClient';
import { ExportMenu } from '@/components/editor/ExportMenu';
import { FormattingToolbar } from '@/components/editor/FormattingToolbar';
import { PaperCanvas } from '@/components/editor/PaperCanvas';
import { StatusBar } from '@/components/editor/StatusBar';
import { TableBubbleMenu } from '@/components/editor/TableBubbleMenu';
import {
  createKakuExtensions,
  EMPTY_TIPTAP_DOC,
  kakuEditorProps,
  normalizeTiptapDoc,
} from '@/components/editor/TiptapConfig';
import { SidebarDrawer } from '@/components/layout/SidebarDrawer';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { ConflictModal } from '@/components/notes/ConflictModal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAutosave } from '@/hooks/useAutosave';
import { useFolders } from '@/hooks/useFolders';
import {
  useCreateNote,
  useMoveNoteToFolder,
  useSoftDeleteNote,
  useToggleFavoriteNote,
  useTogglePinNote,
} from '@/hooks/useNotes';
import { cn } from '@/lib/cn';
import type { NoteRow } from '@/lib/database.types';
import { computeDocumentMetrics } from '@/lib/export';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/useAppStore';

export function NoteEditorPage() {
  const { id: noteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const openTab = useAppStore((s) => s.openTab);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDrawerOpen = useAppStore((s) => s.isDrawerOpen);
  const toggleDrawer = useAppStore((s) => s.toggleDrawer);

  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const extensions = useMemo(() => createKakuExtensions('Write something cozy...'), []);

  const editor = useEditor({
    extensions,
    content: EMPTY_TIPTAP_DOC,
    editorProps: kakuEditorProps,
    onUpdate: ({ editor: instance }) => {
      const metrics = computeDocumentMetrics(instance.getText({ blockSeparator: ' ' }));
      setCharCount(metrics.characterCount);
      setWordCount(metrics.wordCount);
    },
  });

  const { data: folders = [] } = useFolders();
  const createNote = useCreateNote();
  const togglePin = useTogglePinNote();
  const toggleFavorite = useToggleFavoriteNote();
  const moveNoteToFolder = useMoveNoteToFolder();
  const softDeleteNote = useSoftDeleteNote();

  const {
    data: note,
    isLoading,
    isError,
  } = useQuery<NoteRow | null>({
    queryKey: queryKeys.note(noteId ?? ''),
    enabled: Boolean(noteId),
    queryFn: async () => {
      if (!noteId) return null;
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!note || !editor || editor.isDestroyed) return;

    openTab(note.id);
    setTitle(note.title);

    const normalized = normalizeTiptapDoc(note.content_json);
    editor.commands.setContent(normalized, false);

    const metrics = computeDocumentMetrics(editor.getText({ blockSeparator: ' ' }));
    setCharCount(metrics.characterCount);
    setWordCount(metrics.wordCount);
  }, [note?.id, editor, openTab]);

  const {
    lastSeenUpdatedAt,
    conflictServerNote,
    isResolvingConflict,
    notifyTitleChanged,
    flushSave,
    retryNow,
    resolveKeepLocal,
    resolveAcceptServer,
  } = useAutosave({
    noteId: note?.id,
    editor,
    title,
    initialUpdatedAt: note?.updated_at,
    onTitleSyncedFromServer: (serverTitle) => setTitle(serverTitle),
  });

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    notifyTitleChanged(nextTitle);
  };

  const handleCreateQuickNote = async () => {
    flushSave();
    try {
      const created = await createNote.mutateAsync({});
      navigate(`/notes/${created.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create note.', 'error');
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!note) return;
    try {
      await softDeleteNote.mutateAsync(note.id);
      setIsDeleteConfirmOpen(false);
      showToast('Note moved to trash.', 'info');
      navigate('/', { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete note.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-canvas px-4 py-6 text-ink">
        <div className="mx-auto max-w-5xl space-y-4 rounded-paper border-[1.5px] border-ink bg-paper p-6 shadow-paper">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-8 text-ink">
        <div className="w-full max-w-md space-y-4 rounded-paper border-[1.5px] border-ink bg-paper p-6 text-center shadow-paper">
          <KakuMascot mood="sleepy" size="lg" />
          <h1 className="text-2xl font-black text-ink">Note Not Found</h1>
          <p className="text-sm text-muted">
            This note may have been deleted or does not belong to your account.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-ink bg-toolbar px-4 py-2 text-sm font-bold text-ink shadow-soft"
            >
              Back to Workspace
            </Link>
            <Button
              variant="primary"
              isLoading={createNote.isPending}
              onClick={handleCreateQuickNote}
            >
              New Cozy Note
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      {/* Fixed Top Navbar */}
      <header className="z-30 shrink-0 border-b-[1.5px] border-ink bg-toolbar px-3 py-2 sm:px-6">
        <div className="mx-auto flex w-full max-w-360 flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconButton
              type="button"
              variant="default"
              size="sm"
              aria-label="Toggle notes and folders menu"
              aria-expanded={isDrawerOpen}
              onClick={toggleDrawer}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </IconButton>

            <Link
              to="/"
              onClick={flushSave}
              className="text-lg font-black tracking-tight text-ink hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              KAKUTEXT
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <label htmlFor="note-folder-select" className="sr-only">
              Assign folder
            </label>
            <div className="relative inline-flex items-center">
              <FolderIcon
                className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted"
                aria-hidden="true"
              />
              <select
                id="note-folder-select"
                value={note.folder_id ?? ''}
                onChange={(e) =>
                  moveNoteToFolder.mutate({
                    id: note.id,
                    folderId: e.target.value || null,
                  })
                }
                className="min-h-11 rounded-pill border-[1.5px] border-ink bg-paper pr-3 pl-8 text-xs font-extrabold text-ink shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <IconButton
              type="button"
              size="sm"
              variant={note.pinned ? 'active' : 'default'}
              aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
              aria-pressed={note.pinned}
              onClick={() => togglePin.mutate({ id: note.id, pinned: !note.pinned })}
            >
              <Pin
                className={cn('h-4 w-4', note.pinned && 'fill-accent text-ink')}
                aria-hidden="true"
              />
            </IconButton>

            <IconButton
              type="button"
              size="sm"
              variant={note.favorited ? 'active' : 'default'}
              aria-label={note.favorited ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={note.favorited}
              onClick={() => toggleFavorite.mutate({ id: note.id, favorited: !note.favorited })}
            >
              <Star
                className={cn('h-4 w-4', note.favorited && 'fill-accent text-ink')}
                aria-hidden="true"
              />
            </IconButton>

            <ExportMenu editor={editor} title={title} />

            <IconButton
              type="button"
              size="sm"
              variant="default"
              aria-label="Delete note"
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 text-danger-text" aria-hidden="true" />
            </IconButton>

            <IconButton
              type="button"
              size="sm"
              variant="default"
              aria-label={
                theme === 'light' ? 'Switch to dark pastel theme' : 'Switch to light pastel theme'
              }
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4" aria-hidden="true" />
              )}
            </IconButton>

            <IconButton
              type="button"
              size="sm"
              variant="default"
              aria-label="Open settings"
              onClick={() => {
                flushSave();
                navigate('/settings');
              }}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </IconButton>

            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={createNote.isPending}
              onClick={handleCreateQuickNote}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>New</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Fixed-Height Workspace Split Pane */}
      <div className="mx-auto flex min-h-0 w-full max-w-360 flex-1 gap-4 px-3 py-3 sm:px-6 sm:py-4">
        <SidebarDrawer
          activeNoteId={note.id}
          isCreatingNote={createNote.isPending}
          onCreateNote={handleCreateQuickNote}
          onSelectNote={(targetId) => {
            if (targetId !== note.id) {
              flushSave();
              navigate(`/notes/${targetId}`);
            }
          }}
          onNoteDeleted={(deletedId) => {
            if (deletedId === note.id) {
              navigate('/', { replace: true });
            }
          }}
        />

        {/* Stationery Card: Fixed Toolbar + Scrollable Notes Body + Fixed Status Bar */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-paper border-[1.5px] border-ink bg-paper shadow-paper">
          <div className="shrink-0">
            <FormattingToolbar editor={editor} />
            <TableBubbleMenu editor={editor} />
          </div>

          <main
            id="main-editor"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-canvas/35"
          >
            <PaperCanvas
              editor={editor}
              title={title}
              onTitleChange={handleTitleChange}
              onTitleBlur={flushSave}
            />
          </main>

          <div className="shrink-0">
            <StatusBar
              wordCount={wordCount}
              characterCount={charCount}
              onRetryAutosave={retryNow}
            />
          </div>
        </div>
      </div>

      <ConflictModal
        isOpen={Boolean(conflictServerNote)}
        localUpdatedAt={lastSeenUpdatedAt}
        serverUpdatedAt={conflictServerNote?.updated_at ?? ''}
        serverTitle={conflictServerNote?.title}
        isResolving={isResolvingConflict}
        onKeepLocal={resolveKeepLocal}
        onAcceptServer={resolveAcceptServer}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={`Delete "${title.trim() || 'Untitled Cozy Note'}"?`}
        description="This note will be removed from your active workspace."
        confirmLabel="Delete Note"
        isLoading={softDeleteNote.isPending}
        onConfirm={handleConfirmSoftDelete}
        onClose={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
}