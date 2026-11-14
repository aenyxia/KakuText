import { useEffect, useState, type FormEvent } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Check,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Table as TableIcon,
  Underline,
  Undo2,
  Unlink,
  X,
} from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { isSafeUrl } from '@/lib/validation';

export interface FormattingToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

export function FormattingToolbar({ editor, disabled = false }: FormattingToolbarProps) {
  const [, setSelectionTick] = useState(0);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    const syncToolbar = () => setSelectionTick((n) => n + 1);
    editor.on('selectionUpdate', syncToolbar);
    editor.on('transaction', syncToolbar);
    return () => {
      editor.off('selectionUpdate', syncToolbar);
      editor.off('transaction', syncToolbar);
    };
  }, [editor]);

  const isDisabled = disabled || !editor;

  const handleOpenLinkEditor = () => {
    if (!editor) return;
    const currentHref = (editor.getAttributes('link').href as string | undefined) ?? '';
    setLinkUrl(currentHref);
    setLinkError(null);
    setIsLinkOpen((prev) => !prev);
  };

  const handleApplyLink = (event: FormEvent) => {
    event.preventDefault();
    if (!editor) return;

    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setIsLinkOpen(false);
      setLinkError(null);
      return;
    }

    if (!isSafeUrl(trimmed)) {
      setLinkError('Use a valid http://, https://, or mailto: link.');
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: trimmed, target: '_blank', rel: 'noopener noreferrer nofollow' })
      .run();
    setIsLinkOpen(false);
    setLinkError(null);
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsLinkOpen(false);
    setLinkError(null);
  };

  return (
    <div className="sticky top-0 z-20 border-b-[1.5px] border-ink bg-toolbar">
      <div
        role="toolbar"
        aria-label="Formatting options"
        className="flex items-center gap-1 overflow-x-auto px-2.5 py-1.5"
      >
        <IconButton
          type="button"
          aria-label="Undo"
          variant="toolbar"
          size="sm"
          disabled={isDisabled || !editor.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          type="button"
          aria-label="Redo"
          variant="toolbar"
          size="sm"
          disabled={isDisabled || !editor.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-ink/25" />

        <IconButton
          type="button"
          aria-label="Bold"
          aria-pressed={Boolean(editor?.isActive('bold'))}
          variant={editor?.isActive('bold') ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          type="button"
          aria-label="Italic"
          aria-pressed={Boolean(editor?.isActive('italic'))}
          variant={editor?.isActive('italic') ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          type="button"
          aria-label="Underline"
          aria-pressed={Boolean(editor?.isActive('underline'))}
          variant={editor?.isActive('underline') ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          type="button"
          aria-label="Insert or edit link"
          aria-pressed={Boolean(editor?.isActive('link'))}
          aria-expanded={isLinkOpen}
          variant={editor?.isActive('link') ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={handleOpenLinkEditor}
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-ink/25" />

        <IconButton
          type="button"
          aria-label="Heading 1"
          aria-pressed={Boolean(editor?.isActive('heading', { level: 1 }))}
          variant={editor?.isActive('heading', { level: 1 }) ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          type="button"
          aria-label="Heading 2"
          aria-pressed={Boolean(editor?.isActive('heading', { level: 2 }))}
          variant={editor?.isActive('heading', { level: 2 }) ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          type="button"
          aria-label="Heading 3"
          aria-pressed={Boolean(editor?.isActive('heading', { level: 3 }))}
          variant={editor?.isActive('heading', { level: 3 }) ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-ink/25" />

        <IconButton
          type="button"
          aria-label="Bullet list"
          aria-pressed={Boolean(editor?.isActive('bulletList'))}
          variant={editor?.isActive('bulletList') ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          type="button"
          aria-label="Numbered list"
          aria-pressed={Boolean(editor?.isActive('orderedList'))}
          variant={editor?.isActive('orderedList') ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          type="button"
          aria-label="Checklist"
          aria-pressed={Boolean(editor?.isActive('taskList'))}
          variant={editor?.isActive('taskList') ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="h-4 w-4" aria-hidden="true" />
        </IconButton>

        <IconButton
          type="button"
          aria-label="Insert 3 by 3 table"
          aria-pressed={Boolean(editor?.isActive('table'))}
          variant={editor?.isActive('table') ? 'active' : 'toolbar'}
          size="sm"
          disabled={isDisabled}
          onClick={() =>
            editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <TableIcon className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>

      {isLinkOpen && (
        <form
          onSubmit={handleApplyLink}
          className="flex flex-wrap items-center gap-2 border-t border-line bg-paper px-3 py-2"
        >
          <label htmlFor="kakutext-link-input" className="sr-only">
            Link URL
          </label>
          <input
            id="kakutext-link-input"
            type="url"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              if (linkError) setLinkError(null);
            }}
            placeholder="https://example.com"
            autoFocus
            className="min-h-11 min-w-50 flex-1 rounded-card border-[1.5px] border-ink bg-canvas px-3 py-1.5 text-base text-ink placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
          <div className="flex items-center gap-1">
            <IconButton type="submit" aria-label="Apply link" variant="default" size="sm">
              <Check className="h-4 w-4" aria-hidden="true" />
            </IconButton>
            {editor?.isActive('link') && (
              <IconButton
                type="button"
                aria-label="Remove link"
                variant="default"
                size="sm"
                onClick={handleRemoveLink}
              >
                <Unlink className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            )}
            <IconButton
              type="button"
              aria-label="Cancel link editor"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsLinkOpen(false);
                setLinkError(null);
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>
          {linkError && (
            <p role="alert" className="w-full text-xs font-bold text-danger-text">
              {linkError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}