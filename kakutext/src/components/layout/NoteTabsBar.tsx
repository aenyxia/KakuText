import { useRef, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

export interface OpenNoteTab {
  id: string;
  title: string;
}

export interface NoteTabsBarProps {
  tabs: OpenNoteTab[];
  activeTabId: string | null;
  onSelectTab: (noteId: string) => void;
  onCloseTab: (noteId: string) => void;
  onCreateTab: () => void;
}

export function NoteTabsBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCreateTab,
}: NoteTabsBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (tabs.length === 0) return;

    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const targetTab = tabs[nextIndex];
      tabRefs.current[nextIndex]?.focus();
      onSelectTab(targetTab.id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Open notes"
      className="hidden items-end gap-1 overflow-x-auto px-2 sm:flex"
    >
      {tabs.map((tab, index) => {
        const isSelected = tab.id === activeTabId || (activeTabId === null && index === 0);
        return (
          <div
            key={tab.id}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center rounded-t-card border-[1.5px] border-b-0 border-ink transition-colors',
              isSelected
                ? 'z-10 mb-[-1.5px] bg-tab-active text-ink'
                : 'bg-paper/80 text-muted hover:bg-tab-active/60 hover:text-ink'
            )}
          >
            <button
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="inline-flex min-h-11 max-w-44 cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span aria-hidden="true" className="text-accent-link">
                ✿
              </span>
              <span className="truncate">{tab.title.trim() || 'Untitled Note'}</span>
            </button>

            <button
              type="button"
              aria-label={`Close ${tab.title.trim() || 'Untitled Note'} tab`}
              onClick={() => onCloseTab(tab.id)}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-tr-card text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}

      <IconButton
        aria-label="Create new note tab"
        onClick={onCreateTab}
        className="rounded-b-none rounded-t-card border-b-0 bg-paper/80"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    </div>
  );
}