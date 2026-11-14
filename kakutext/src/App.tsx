import { useEffect, useState } from 'react';
import {
  Bold,
  Check,
  CheckSquare,
  Download,
  FolderPlus,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Moon,
  Plus,
  Redo2,
  Save,
  Sun,
  Table,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react';
import { KakuMascot, type MascotMood } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

type ThemeMode = 'light' | 'dark';

const NOTE_TABS = [
  'Lab1tasks',
  'Prompt Notes',
  'Instructions',
  'Project Plan',
  'Empty Tab',
  'Quick Drafts',
];

const MASCOT_POSES: MascotMood[] = ['happy', 'thinking', 'sleepy', 'cheering'];

function StationeryPreview() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [activeTab, setActiveTab] = useState(3);
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({
    bold: true,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    h3: false,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  const [taskOneDone, setTaskOneDone] = useState(true);
  const [taskTwoDone, setTaskTwoDone] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleFormat = (key: string) => {
    setActiveFormats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      setFieldError('Please enter a folder name.');
      setMascotMood('sleepy');
      return;
    }
    setFieldError(undefined);
    setIsDialogOpen(false);
    setMascotMood('cheering');
    showToast(`Saved folder "${folderName.trim()}"`, 'success');
    setFolderName('');
  };

  return (
    <div className="min-h-dvh bg-canvas px-3 py-4 text-ink sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl space-y-3">
        {/* Top Header matching the reference pill-action bar */}
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-black tracking-tight text-ink">KAKUTEXT</span>
            <span className="rounded-pill border-[1.5px] border-ink bg-paper px-2.5 py-0.5 text-xs font-extrabold text-ink shadow-soft">
              APP
            </span>
            <span className="hidden rounded-pill border-[1.5px] border-ink bg-tab-active px-2.5 py-0.5 text-xs font-extrabold text-muted sm:inline-flex">
              COZY NOTES
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="border-[1.5px] border-ink"
              onClick={() => {
                setMascotMood('thinking');
                showToast('Exported Markdown preview!', 'info');
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </Button>

            <Button
              size="sm"
              className="border-[1.5px] border-ink"
              onClick={() => {
                setMascotMood('cheering');
                showToast('Note saved cozy & safe!', 'success');
              }}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="border-[1.5px] border-ink"
              onClick={() => setIsDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4" aria-hidden="true" />
              New Folder
            </Button>

            <Button
              variant="danger"
              size="sm"
              className="border-[1.5px] border-ink"
              onClick={() => {
                setMascotMood('sleepy');
                showToast('Moved note to trash.', 'error');
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>

            <IconButton
              aria-label={theme === 'light' ? 'Switch to dark pastel theme' : 'Switch to light pastel theme'}
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              className="rounded-pill border-[1.5px] border-ink"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </IconButton>
          </div>
        </header>

        {/* Outer Warm Apricot Stationery Frame */}
        <div className="rounded-paper border-[1.5px] border-ink bg-toolbar/75 p-2 shadow-paper sm:p-3">
          {/* Index Tabs Strip (hidden on <640px mobile per KakuText layout spec) */}
          <div
            role="tablist"
            aria-label="Open notes"
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
                    'relative inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-t-card border-[1.5px] border-b-0 border-ink px-3.5 py-2 text-xs font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                    isActive
                      ? 'z-10 mb-[-1.5px] bg-tab-active text-ink'
                      : 'bg-paper/80 text-muted hover:bg-tab-active/60 hover:text-ink'
                  )}
                >
                  <span aria-hidden="true" className="text-accent-link">
                    ✿
                  </span>
                  <span>{tab}</span>
                  <span aria-hidden="true" className="ml-1 opacity-55">
                    ×
                  </span>
                </button>
              );
            })}

            <IconButton
              aria-label="Create new note tab"
              variant="default"
              onClick={() => {
                setMascotMood('cheering');
                showToast('Opened a fresh note tab!', 'success');
              }}
              className="rounded-b-none rounded-t-card border-[1.5px] border-b-0 border-ink bg-paper/80"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>

          {/* Main Stationery Paper Card */}
          <main className="overflow-hidden rounded-paper border-[1.5px] border-ink bg-paper shadow-paper">
            {/* Whitelisted Rich-Text Formatting Toolbar */}
            <div
              role="toolbar"
              aria-label="Formatting options"
              className="flex items-center gap-1 overflow-x-auto border-b-[1.5px] border-ink bg-toolbar px-2.5 py-2"
            >
              <IconButton
                aria-label="Bold"
                variant="toolbar"
                isActive={activeFormats.bold}
                onClick={() => toggleFormat('bold')}
              >
                <Bold className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="Italic"
                variant="toolbar"
                isActive={activeFormats.italic}
                onClick={() => toggleFormat('italic')}
              >
                <Italic className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="Underline"
                variant="toolbar"
                isActive={activeFormats.underline}
                onClick={() => toggleFormat('underline')}
              >
                <Underline className="h-4 w-4" aria-hidden="true" />
              </IconButton>

              <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-line" />

              <IconButton
                aria-label="Heading 1"
                variant="toolbar"
                isActive={activeFormats.h1}
                onClick={() => toggleFormat('h1')}
              >
                <Heading1 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="Heading 2"
                variant="toolbar"
                isActive={activeFormats.h2}
                onClick={() => toggleFormat('h2')}
              >
                <Heading2 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="Heading 3"
                variant="toolbar"
                isActive={activeFormats.h3}
                onClick={() => toggleFormat('h3')}
              >
                <Heading3 className="h-4 w-4" aria-hidden="true" />
              </IconButton>

              <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-line" />

              <IconButton
                aria-label="Bullet list"
                variant="toolbar"
                onClick={() => showToast('Toggled bullet list', 'info')}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="Numbered list"
                variant="toolbar"
                onClick={() => showToast('Toggled numbered list', 'info')}
              >
                <ListOrdered className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="Checklist"
                variant="toolbar"
                onClick={() => showToast('Toggled checklist', 'info')}
              >
                <CheckSquare className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="Insert link"
                variant="toolbar"
                onClick={() => showToast('Insert link dialog ready in Step 5', 'info')}
              >
                <Link2 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label="Insert table"
                variant="toolbar"
                onClick={() => showToast('Inserted 2×2 stationery table', 'info')}
              >
                <Table className="h-4 w-4" aria-hidden="true" />
              </IconButton>

              <div className="ml-auto flex items-center gap-1">
                <IconButton aria-label="Undo" variant="toolbar">
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                </IconButton>
                <IconButton aria-label="Redo" variant="toolbar">
                  <Redo2 className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              </div>
            </div>

            {/* Inner Paper Canvas with Dashed Stationery Border */}
            <div className="p-3 sm:p-5">
              <div className="relative rounded-card border-2 border-dashed border-(--border-dashed) bg-paper p-4 pb-32 sm:p-6 sm:pb-24">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-3 right-3 text-base text-muted select-none"
                >
                  ✿ ✨
                </span>

                <h1 className="pr-12 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                  Document: {NOTE_TABS[activeTab]} ✨
                </h1>

                {/* Cozy Floral Bullet List */}
                <ul className="mt-4 space-y-1.5 text-base font-bold text-ink">
                  <li className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ✿
                    </span>
                    <span>Brainstorm cozy core features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ✿
                    </span>
                    <span>Draft initial layout on desktop &amp; mobile</span>
                  </li>
                </ul>

                {/* Rich-Text Sample Copy */}
                <p className="mt-4 text-base leading-relaxed text-ink">
                  This is a rich-text stationery editor supporting formatting options. You can make
                  words <strong>bold</strong>, <em>italic</em>,{' '}
                  <span className="underline decoration-2">underlined</span>, or add{' '}
                  <a
                    href="#links"
                    className="font-bold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    accessible links
                  </a>
                  , tables, and interactive checklists.
                </p>

                {/* Dashed Callout Box with Mascot Pose Switcher */}
                <div className="mt-4 rounded-card border border-dashed border-(--border-dashed) bg-canvas/80 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold tracking-wide text-muted uppercase">
                      KakuMascot Pose Preview
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {MASCOT_POSES.map((pose) => (
                        <Button
                          key={pose}
                          size="sm"
                          variant={mascotMood === pose ? 'primary' : 'secondary'}
                          onClick={() => setMascotMood(pose)}
                          className="border-[1.5px] border-ink capitalize"
                        >
                          {pose}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Checklist matching the reference image */}
                <div className="mt-4 space-y-1.5">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-base font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={taskOneDone}
                      onChange={(e) => setTaskOneDone(e.target.checked)}
                      className="h-5 w-5 rounded accent-accent"
                    />
                    <span className={cn(taskOneDone && 'text-muted line-through')}>
                      Draft new stationery layout specs
                    </span>
                  </label>

                  <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-base font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={taskTwoDone}
                      onChange={(e) => setTaskTwoDone(e.target.checked)}
                      className="h-5 w-5 rounded accent-accent"
                    />
                    <span className={cn(taskTwoDone && 'text-muted line-through')}>
                      Complete all 4 mascot SVG pose checks
                    </span>
                  </label>
                </div>

                {/* Compact Skeleton Loading Preview */}
                <div className="mt-4 max-w-xs space-y-1.5">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-7 w-full" />
                </div>

                {/* Bottom-Right Floating Duckling Mascot Sticker */}
                <div className="absolute right-3 bottom-3 sm:right-5 sm:bottom-4">
                  <KakuMascot mood={mascotMood} size="lg" />
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t-[1.5px] border-ink bg-toolbar px-4 py-2.5 text-xs font-extrabold text-ink">
              <span>234 words | 1,482 characters</span>

              <span className="rounded-pill border-[1.5px] border-ink bg-accent px-3.5 py-1 text-accent-fg shadow-soft">
                ♥ quiet heart, kind soul ♥
              </span>

              <span aria-live="polite" className="inline-flex items-center gap-1 text-ink">
                <Check className="h-4 w-4" aria-hidden="true" />
                Auto-saved
              </span>
            </footer>
          </main>
        </div>

        {/* Accessible Folder Modal */}
        <Dialog
          isOpen={isDialogOpen}
          title="Create Cozy Folder"
          description="Press Escape, click outside, or tab through controls to verify focus trapping."
          onClose={() => {
            setFieldError(undefined);
            setIsDialogOpen(false);
          }}
        >
          <div className="space-y-4">
            <TextField
              label="Folder name"
              placeholder="e.g., Study Notes"
              value={folderName}
              error={fieldError}
              onChange={(event) => setFolderName(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFolder}>Save Folder</Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <StationeryPreview />
    </ToastProvider>
  );
}