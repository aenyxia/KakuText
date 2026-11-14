import { FilePlus2, Menu, Moon, Settings, Sun } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SidebarDrawer } from '@/components/layout/SidebarDrawer';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { useCreateNote } from '@/hooks/useNotes';
import { useAppStore } from '@/stores/useAppStore';

export function WorkspacePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDrawerOpen = useAppStore((s) => s.isDrawerOpen);
  const toggleDrawer = useAppStore((s) => s.toggleDrawer);

  const createNote = useCreateNote();

  const handleCreateNote = async () => {
    try {
      const created = await createNote.mutateAsync({});
      navigate(`/notes/${created.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create note.', 'error');
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      {/* Fixed Top Navbar */}
      <header className="z-30 shrink-0 border-b-[1.5px] border-ink bg-toolbar px-3 py-2 sm:px-6">
        <div className="mx-auto flex w-full max-w-360 items-center justify-between gap-2">
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
  className="inline-flex min-h-11 items-center gap-2.5 rounded-card pr-1.5 text-lg font-black tracking-tight text-ink hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
>
  
  <span>KAKUTEXT</span>
</Link>
          </div>

          <div className="flex items-center gap-1.5">
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
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </IconButton>

            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={createNote.isPending}
              onClick={handleCreateNote}
            >
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              <span>New Cozy Note</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Fixed-Height Workspace Split Pane */}
      <div className="mx-auto flex min-h-0 w-full max-w-360 flex-1 gap-4 px-3 py-3 sm:px-6 sm:py-4">
        <SidebarDrawer
          isCreatingNote={createNote.isPending}
          onCreateNote={handleCreateNote}
          onSelectNote={(targetId) => navigate(`/notes/${targetId}`)}
        />

        <main
          id="main-workspace"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain rounded-paper border-[1.5px] border-ink bg-paper p-4 shadow-paper sm:p-6"
        >
          <div className="relative flex flex-1 flex-col items-start justify-center gap-3 rounded-card border-2 border-dashed border-(--border-dashed) p-6 pb-28 sm:p-10">
            <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
              Welcome to KakuText ✨
            </h1>
            <p className="max-w-lg text-sm text-muted sm:text-base">
              Select a note from the sidebar or create a new cozy note to start writing on your
              stationery canvas.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={createNote.isPending}
              onClick={handleCreateNote}
            >
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              <span>New Cozy Note</span>
            </Button>

            <div className="pointer-events-none absolute right-4 bottom-4 select-none">
              <KakuMascot mood="happy" size="lg" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}