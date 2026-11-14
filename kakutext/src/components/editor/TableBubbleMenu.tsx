import { useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Columns,
  Rows,
  Trash2,
} from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

export interface TableBubbleMenuProps {
  editor: Editor | null;
}

interface MenuCoords {
  top: number;
  left: number;
}

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  const [isTableActive, setIsTableActive] = useState(false);
  const [coords, setCoords] = useState<MenuCoords>({ top: 80, left: 16 });

  const updateMenuPosition = useCallback(() => {
    if (!editor || editor.isDestroyed) {
      setIsTableActive(false);
      return;
    }

    const active = editor.isActive('table');
    setIsTableActive(active);

    if (!active) return;

    try {
      const { from } = editor.state.selection;
      const startCoords = editor.view.coordsAtPos(from);
      const viewportWidth = window.innerWidth;
      const menuWidth = Math.min(340, viewportWidth - 24);
      const clampedLeft = Math.max(
        12,
        Math.min(startCoords.left, viewportWidth - menuWidth - 12)
      );
      const clampedTop = Math.max(64, startCoords.top - 56);

      setCoords({ top: clampedTop, left: clampedLeft });
    } catch {
      // Keep previous safe coordinates if DOM range is temporarily unavailable
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    updateMenuPosition();

    editor.on('selectionUpdate', updateMenuPosition);
    editor.on('transaction', updateMenuPosition);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      editor.off('selectionUpdate', updateMenuPosition);
      editor.off('transaction', updateMenuPosition);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [editor, updateMenuPosition]);

  if (!editor || !isTableActive) {
    return null;
  }

  return (
    <div
      role="toolbar"
      aria-label="Table formatting options"
      style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
      className="fixed z-30 flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-x-auto rounded-pill border-[1.5px] border-ink bg-toolbar px-2 py-1 shadow-paper"
    >
      <IconButton
        type="button"
        aria-label="Add row above"
        variant="toolbar"
        size="sm"
        onClick={() => editor.chain().focus().addRowBefore().run()}
      >
        <ArrowUpToLine className="h-4 w-4" aria-hidden="true" />
      </IconButton>

      <IconButton
        type="button"
        aria-label="Add row below"
        variant="toolbar"
        size="sm"
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
      </IconButton>

      <IconButton
        type="button"
        aria-label="Delete row"
        variant="toolbar"
        size="sm"
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        <Rows className="h-4 w-4 text-danger-text" aria-hidden="true" />
      </IconButton>

      <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-ink/25" />

      <IconButton
        type="button"
        aria-label="Add column left"
        variant="toolbar"
        size="sm"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
      >
        <ArrowLeftToLine className="h-4 w-4" aria-hidden="true" />
      </IconButton>

      <IconButton
        type="button"
        aria-label="Add column right"
        variant="toolbar"
        size="sm"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <ArrowRightToLine className="h-4 w-4" aria-hidden="true" />
      </IconButton>

      <IconButton
        type="button"
        aria-label="Delete column"
        variant="toolbar"
        size="sm"
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        <Columns className="h-4 w-4 text-danger-text" aria-hidden="true" />
      </IconButton>

      <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-ink/25" />

      <IconButton
        type="button"
        aria-label="Delete table"
        variant="toolbar"
        size="sm"
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <Trash2 className="h-4 w-4 text-danger-text" aria-hidden="true" />
      </IconButton>
    </div>
  );
}