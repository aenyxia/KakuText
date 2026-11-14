import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Underline from '@tiptap/extension-underline';
import type { EditorOptions, Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import type { TiptapDoc } from '@/lib/database.types';
import { sanitizeRichHtml, sanitizeTiptapDoc } from '@/lib/sanitize';
import { isSafeUrl } from '@/lib/validation';

export const EMPTY_TIPTAP_DOC: TiptapDoc = {
  type: 'doc',
  content: [],
};

/**
 * Normalizes and sanitizes incoming content_json from Supabase before loading into Tiptap.
 */
export function normalizeTiptapDoc(raw: unknown): TiptapDoc {
  if (
    typeof raw === 'object' &&
    raw !== null &&
    !Array.isArray(raw) &&
    (raw as { type?: unknown }).type === 'doc'
  ) {
    return sanitizeTiptapDoc(raw as TiptapDoc);
  }
  return EMPTY_TIPTAP_DOC;
}

/**
 * Creates KakuText's strictly whitelisted Tiptap extension array.
 * Excludes images, blockquotes, code blocks, inline code, and strikethrough per schema whitelist.
 */
export function createKakuExtensions(placeholder = 'Write something cozy...'): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
      blockquote: false,
      codeBlock: false,
      code: false,
      strike: false,
      horizontalRule: false,
      history: {
        depth: 100,
        newGroupDelay: 500,
      },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      validate: (href) => isSafeUrl(href),
      HTMLAttributes: {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      },
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Table.configure({
      resizable: false,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
    Markdown.configure({
      html: false,
      tightLists: true,
      bulletListMarker: '-',
      linkify: false,
      breaks: false,
      transformPastedText: false,
      transformCopiedText: false,
    }),
  ];
}

function clipboardHasImageOrFile(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return true;
  }
  if (dataTransfer.items) {
    for (let i = 0; i < dataTransfer.items.length; i += 1) {
      const item = dataTransfer.items[i];
      if (item && (item.kind === 'file' || item.type.startsWith('image/'))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Strips images and non-whitelisted HTML tags/attributes from clipboard HTML before ProseMirror parses it.
 */
export function filterPastedHtml(dirtyHtml: string): string {
  const sanitized = sanitizeRichHtml(dirtyHtml);
  if (typeof window === 'undefined') return sanitized;

  const doc = new DOMParser().parseFromString(sanitized, 'text/html');
  doc.querySelectorAll('img, picture, figure, svg, video, audio, canvas, iframe').forEach((el) => {
    el.remove();
  });
  return doc.body.innerHTML;
}

export const kakuEditorProps: NonNullable<EditorOptions['editorProps']> = {
  attributes: {
    class: 'kaku-prose focus:outline-none min-h-[24rem]',
    role: 'textbox',
    'aria-multiline': 'true',
    'aria-label': 'Note body editor',
    spellcheck: 'true',
  },
  transformPastedHTML(html) {
    return filterPastedHtml(html);
  },
  handlePaste(_view, event) {
    const clipboard = event.clipboardData;
    if (!clipboard) return false;

    const hasPlainOrHtml =
      Boolean(clipboard.getData('text/plain')) || Boolean(clipboard.getData('text/html'));
    if (clipboardHasImageOrFile(clipboard) && !hasPlainOrHtml) {
      event.preventDefault();
      return true;
    }

    return false;
  },
  handleDrop(_view, event) {
    if (clipboardHasImageOrFile(event.dataTransfer)) {
      event.preventDefault();
      return true;
    }
    return false;
  },
};