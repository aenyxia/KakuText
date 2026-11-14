import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Download, FileCode2, FileText } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { exportNoteToMarkdown, exportNoteToPlainText } from '@/lib/export';

export interface ExportMenuProps {
  editor: Editor | null;
  title: string;
}

export function ExportMenu({ editor, title }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleExportMd = () => {
    if (!editor || editor.isDestroyed) return;
    const filename = exportNoteToMarkdown(editor, title);
    setIsOpen(false);
    showToast(`Exported ${filename}`, 'success');
  };

  const handleExportTxt = () => {
    if (!editor || editor.isDestroyed) return;
    const filename = exportNoteToPlainText(editor, title);
    setIsOpen(false);
    showToast(`Exported ${filename}`, 'success');
  };

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        type="button"
        size="sm"
        variant={isOpen ? 'active' : 'default'}
        disabled={!editor}
        aria-label="Export note"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
      </IconButton>

      {isOpen && (
        <div
          role="menu"
          aria-label="Export options"
          className="absolute right-0 z-30 mt-1.5 w-52 rounded-card border-[1.5px] border-ink bg-paper p-1.5 shadow-paper"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleExportMd}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-card px-3 py-2 text-left text-xs font-extrabold text-ink hover:bg-tab-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <FileCode2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Download Markdown (.md)</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleExportTxt}
            className="mt-0.5 flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-card px-3 py-2 text-left text-xs font-extrabold text-ink hover:bg-tab-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Download Plain Text (.txt)</span>
          </button>
        </div>
      )}
    </div>
  );
}