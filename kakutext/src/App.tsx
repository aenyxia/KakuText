import { useEffect, useState } from 'react';
import { Check, FolderPlus, Moon, Plus, Save, Sun, Trash2 } from 'lucide-react';
import { KakuMascot, type MascotMood } from '@/components/mascot/KakuMascot';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

type ThemeMode = 'light' | 'dark';

const ALL_MOODS: MascotMood[] = ['happy', 'saving', 'thinking', 'cheering', 'sleepy', 'slowdown'];

const NOTE_TABS = ['Study Notes', 'Project Plan', 'Daily Journal', 'Quick Drafts'];

function DesignSystemShowcase() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [activeTab, setActiveTab] = useState(1);
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderError, setFolderError] = useState<string | undefined>(undefined);

  const isDesktop = useMediaQuery('(min-width: 640px)');
  const { showToast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      setFolderError('Folder name must be 1–50 characters.');
      setMascotMood('sleepy');
      return;
    }
    setFolderError(undefined);
    setIsFolderModalOpen(false);
    setMascotMood('cheering');
    showToast(`Created folder "${folderName.trim()}"`, 'success');
    setFolderName('');
  };

  return (
    <div className="min-h-dvh bg-canvas px-3 py-4 text-ink sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl space-y-3">
        {/* Top Action Bar */}
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-ink">KAKUTEXT</span>
            <Badge variant="default">MOD-002</Badge>
            <Badge variant="muted">{isDesktop ? 'Desktop View' : 'Mobile View'}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setMascotMood('saving');
                showToast('Autosaved cozy note!', 'success');
              }}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFolderModalOpen(true)}
            >
              <FolderPlus className="h-4 w-4" aria-hidden="true" />
              New Folder
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>

            <IconButton
              aria-label={
                theme === 'light' ? 'Switch to dark pastel theme' : 'Switch to light pastel theme'
              }
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              className="rounded-pill"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </IconButton>
          </div>
        </header>

        {/* Stationery Outer Frame */}
        <div className="rounded-paper border-[1.5px] border-ink bg-toolbar/75 p-2 shadow-paper sm:p-3">
          {/* Index Tabs (visible >= 640px) */}
          <div
            role="tablist"
            aria-label="Sample note tabs"
            className="hidden items-end gap-1 overflow-x-auto px-2 sm:flex"
          >
            {NOTE_TABS.map((tab, index) => {
              const isActive = activeTab === index;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(index)}
                  className={cn(
                    'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-t-card border-[1.5px] border-b-0 border-ink px-3.5 py-2 text-xs font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                    isActive
                      ? 'z-10 mb-[-1.5px] bg-tab-active text-ink'
                      : 'bg-paper/80 text-muted hover:bg-tab-active/60 hover:text-ink'
                  )}
                >
                  <span aria-hidden="true">✿</span>
                  <span>{tab}</span>
                </button>
              );
            })}
            <IconButton
              aria-label="New tab"
              onClick={() => showToast('New tab clicked!', 'info')}
              className="rounded-b-none rounded-t-card border-b-0 bg-paper/80"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>

          {/* Paper Canvas */}
          <main className="overflow-hidden rounded-paper border-[1.5px] border-ink bg-paper shadow-paper">
            <div className="border-b-[1.5px] border-ink bg-toolbar px-4 py-2 text-xs font-extrabold text-ink">
              Pastel Design System, Accessible UI Primitives &amp; Mascot Engine
            </div>

            <div className="p-3 sm:p-5">
              <div className="relative rounded-card border-2 border-dashed border-(--border-dashed) bg-paper p-4 pb-32 sm:p-6 sm:pb-24">
                <h1 className="text-2xl font-black tracking-tight text-ink">
                  {NOTE_TABS[activeTab]} ✨
                </h1>
                <p className="mt-1 text-sm text-muted">
                  Test all 6 mascot moods, accessible form controls, modals, toasts, and loading
                  skeletons in Light and Dark Pastel themes.
                </p>

                {/* Mascot Mood Switcher */}
                <div className="mt-4 rounded-card border border-dashed border-(--border-dashed) bg-canvas/80 p-3.5">
                  <p className="mb-2 text-xs font-extrabold tracking-wide text-muted uppercase">
                    Mascot Moods ({mascotMood})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_MOODS.map((mood) => (
                      <Button
                        key={mood}
                        size="sm"
                        variant={mascotMood === mood ? 'primary' : 'secondary'}
                        onClick={() => setMascotMood(mood)}
                        className="capitalize"
                      >
                        {mood}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Accessible Input & Skeleton Preview */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Accessible TextField"
                    placeholder="16px font prevents iOS zoom..."
                    hint="Linked automatically via aria-describedby."
                  />
                  <div className="space-y-2">
                    <span className="block text-sm font-bold text-ink">Skeleton Placeholders</span>
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                </div>

                {/* Corner Mascot */}
                <div className="absolute right-3 bottom-3 sm:right-5 sm:bottom-4">
                  <KakuMascot
                    mood={mascotMood}
                    size="lg"
                    label={`Kaku mascot feeling ${mascotMood}`}
                  />
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] border-ink bg-toolbar px-4 py-2.5 text-xs font-extrabold text-ink">
              <span>WCAG AA Contrast Verified</span>
              <Badge variant="accent">♥ quiet heart, kind soul ♥</Badge>
              <span aria-live="polite" className="inline-flex items-center gap-1">
                <Check className="h-4 w-4" aria-hidden="true" />
                Ready
              </span>
            </footer>
          </main>
        </div>

        {/* Folder Dialog */}
        <Dialog
          isOpen={isFolderModalOpen}
          title="Create Cozy Folder"
          description="Press Escape, click the backdrop, or Tab through controls to test focus trapping."
          onClose={() => {
            setFolderError(undefined);
            setIsFolderModalOpen(false);
          }}
        >
          <div className="space-y-4">
            <TextField
              label="Folder name"
              placeholder="e.g., Reading List"
              value={folderName}
              error={folderError}
              onChange={(event) => setFolderName(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsFolderModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFolder}>Save Folder</Button>
            </div>
          </div>
        </Dialog>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          title="Delete this note?"
          description="This note will be moved to trash. You can test keyboard focus trapping here too."
          confirmLabel="Delete Note"
          onConfirm={() => {
            setIsDeleteConfirmOpen(false);
            setMascotMood('sleepy');
            showToast('Note deleted.', 'error');
          }}
          onClose={() => setIsDeleteConfirmOpen(false)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <DesignSystemShowcase />
    </ToastProvider>
  );
}