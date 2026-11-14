import { Download, FilePlus2, Menu, Moon, Settings, Sun, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import type { ThemeMode } from '@/stores/useAppStore';

export interface TopHeaderProps {
  activeNoteTitle: string;
  isDrawerOpen: boolean;
  theme: ThemeMode;
  hasActiveNote: boolean;
  onToggleDrawer: () => void;
  onCreateNote: () => void;
  onExportMarkdown: () => void;
  onExportText: () => void;
  onToggleTheme: () => void;
  onDeleteNote: () => void;
}

export function TopHeader({
  activeNoteTitle,
  isDrawerOpen,
  theme,
  hasActiveNote,
  onToggleDrawer,
  onCreateNote,
  onExportMarkdown,
  onExportText,
  onToggleTheme,
  onDeleteNote,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b-[1.5px] border-ink bg-canvas/95 px-3 py-2 backdrop-blur-xs sm:px-6">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconButton
            aria-label="Toggle notes sidebar"
            aria-expanded={isDrawerOpen}
            onClick={onToggleDrawer}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </IconButton>

          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-card px-1 text-xl font-black tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:text-2xl"
          >
            <span>KAKUTEXT</span>
            <Badge variant="default" className="hidden max-w-44 truncate sm:inline-flex">
              {activeNoteTitle.trim() || 'NOTES'}
            </Badge>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button size="sm" onClick={onCreateNote}>
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            <span>New Note</span>
          </Button>

          {hasActiveNote && (
            <>
              <Button variant="secondary" size="sm" onClick={onExportMarkdown}>
                <Download className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">.MD</span>
              </Button>

              <Button variant="secondary" size="sm" onClick={onExportText}>
                <span className="text-xs font-extrabold">.TXT</span>
              </Button>

              <Button variant="danger" size="sm" onClick={onDeleteNote}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </>
          )}

          <Link
            to="/settings"
            aria-label="Open settings"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-pill border-[1.5px] border-ink bg-paper text-ink shadow-soft transition-transform hover:bg-toolbar active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Link>

          <IconButton
            aria-label={
              theme === 'light' ? 'Switch to dark pastel theme' : 'Switch to light pastel theme'
            }
            onClick={onToggleTheme}
            className="rounded-pill"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </IconButton>
        </div>
      </div>
    </header>
  );
}