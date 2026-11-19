import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Underline from '@tiptap/extension-underline';
import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { EditorOptions, Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import type { TiptapDoc } from '@/lib/database.types';
import { sanitizeRichHtml, sanitizeTiptapDoc } from '@/lib/sanitize';
import { isSafeUrl } from '@/lib/validation';

const INDENT_STR = '    ';

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

/**
 * Indents or outdents the current cursor or highlighted text selection in ProseMirror.
 */
export function applyTabIndentation(view: EditorView, shiftKey: boolean): boolean {
  const { state } = view;
  const { selection } = state;
  const { $from, $to, empty, from, to } = selection;

  // Keep native Tab cell navigation inside tables
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const nodeName = $from.node(depth).type.name;
    if (nodeName === 'tableCell' || nodeName === 'tableHeader') {
      return false;
    }
  }

  // Collapsed cursor inside a list/checklist: let Tiptap nest/unnest the list item
  if (empty) {
    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const nodeName = $from.node(depth).type.name;
      if (nodeName === 'listItem' || nodeName === 'taskItem') {
        return false;
      }
    }

    if (!shiftKey) {
      view.dispatch(state.tr.insertText(INDENT_STR));
      return true;
    }

    const blockStart = $from.start();
    const leadingText = state.doc.textBetween(
      blockStart,
      Math.min(blockStart + INDENT_STR.length, $from.end())
    );
    const spacesToRemove = leadingText.match(/^ {1,4}/)?.[0].length ?? 0;
    if (spacesToRemove > 0) {
      view.dispatch(state.tr.delete(blockStart, blockStart + spacesToRemove));
    }
    return true;
  }

  // Collect every textblock touched by the mouse/keyboard highlight
  const blocks: { start: number; text: string }[] = [];
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.isTextblock) {
      blocks.push({ start: pos + 1, text: node.textContent });
      return false;
    }
    return true;
  });

  if (blocks.length === 0) {
    return false;
  }

  const tr = state.tr;

  // Single-line mid-sentence highlight (starts after the beginning of the line, not full line):
  // indent right before the highlighted text so the selected phrase shifts visibly
  const isSingleBlock = blocks.length === 1 && $from.sameParent($to);
  const startsMidLine = isSingleBlock && from > blocks[0].start && to < $from.end();

  if (startsMidLine) {
    if (!shiftKey) {
      tr.insertText(INDENT_STR, from);
      tr.setSelection(
        TextSelection.create(tr.doc, from + INDENT_STR.length, to + INDENT_STR.length)
      );
      view.dispatch(tr);
    } else {
      const beforeStart = Math.max(blocks[0].start, from - INDENT_STR.length);
      const beforeText = state.doc.textBetween(beforeStart, from);
      const spacesToRemove = beforeText.match(/ {1,4}$/)?.[0].length ?? 0;
      if (spacesToRemove > 0) {
        tr.delete(from - spacesToRemove, from);
        tr.setSelection(TextSelection.create(tr.doc, from - spacesToRemove, to - spacesToRemove));
        view.dispatch(tr);
      }
    }
    return true;
  }

  // Multi-line highlight or full-line highlight: indent/outdent the start of every selected block
  let firstBlockShift = 0;
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const block = blocks[i];
    if (!shiftKey) {
      tr.insertText(INDENT_STR, block.start);
      if (i === 0) firstBlockShift = INDENT_STR.length;
    } else {
      const spacesToRemove = block.text.match(/^ {1,4}/)?.[0].length ?? 0;
      if (spacesToRemove > 0) {
        tr.delete(block.start, block.start + spacesToRemove);
        if (i === 0) firstBlockShift = -spacesToRemove;
      }
    }
  }

  if (tr.docChanged) {
    const firstBlockStart = blocks[0].start;
    const mappedFrom =
      from <= firstBlockStart
        ? firstBlockStart + firstBlockShift
        : tr.mapping.map(from, 1);
    const mappedTo = tr.mapping.map(to, 1);

    tr.setSelection(
      TextSelection.create(
        tr.doc,
        Math.max(0, Math.min(mappedFrom, tr.doc.content.size)),
        Math.max(0, Math.min(mappedTo, tr.doc.content.size))
      )
    );
    view.dispatch(tr);
  }

  return true;
}

export const kakuEditorProps: NonNullable<EditorOptions['editorProps']> = {
  attributes: {
    class: 'kaku-prose focus:outline-none min-h-[24rem]',
    role: 'textbox',
    'aria-multiline': 'true',
    'aria-label': 'Note body editor',
    spellcheck: 'true',
  },
  handleKeyDown(view, event) {
    if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) {
      return false;
    }

    const handled = applyTabIndentation(view, event.shiftKey);
    if (handled) {
      event.preventDefault();
    }
    return handled;
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
