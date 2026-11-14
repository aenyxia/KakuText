import DOMPurify, { type Config } from 'dompurify';
import type { Json, TiptapDoc } from '@/lib/database.types';
import { isSafeUrl } from '@/lib/validation';

const ALLOWED_HTML_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'code',
  'pre',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'input',
  'label',
  'a',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'mark',
  'span',
  'div',
];

const ALLOWED_HTML_ATTRS = [
  'href',
  'target',
  'rel',
  'type',
  'checked',
  'disabled',
  'data-type',
  'data-checked',
  'colspan',
  'rowspan',
  'class',
];

const RICH_HTML_CONFIG: Config = {
  ALLOWED_TAGS: ALLOWED_HTML_TAGS,
  ALLOWED_ATTR: ALLOWED_HTML_ATTRS,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg', 'math'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
};

const SEARCH_SNIPPET_CONFIG: Config = {
  ALLOWED_TAGS: ['mark', 'b', 'strong', 'em'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

let hooksRegistered = false;

function ensureSanitizeHooks(): void {
  if (hooksRegistered || typeof window === 'undefined') return;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') ?? '';
      if (!isSafeUrl(href)) {
        node.removeAttribute('href');
      } else if (/^https?:/i.test(href)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer nofollow');
      }
    }

    if (node.tagName === 'INPUT') {
      const inputType = node.getAttribute('type');
      if (inputType !== 'checkbox') {
        node.remove();
        return;
      }
      node.setAttribute('disabled', 'true');
    }
  });

  hooksRegistered = true;
}

/**
 * Sanitizes rich-text HTML (for Markdown/HTML export previews or pasted HTML)
 * against a strict allowlist of Tiptap-compatible tags and safe link protocols.
 */
export function sanitizeRichHtml(dirtyHtml: string): string {
  ensureSanitizeHooks();
  return DOMPurify.sanitize(dirtyHtml, RICH_HTML_CONFIG);
}

/**
 * Sanitizes PostgreSQL ts_headline() snippet strings so only highlight tags
 * survive and any raw HTML inside note content is escaped.
 */
export function sanitizeSearchSnippet(dirtySnippet: string): string {
  if (!dirtySnippet) return '';
  return DOMPurify.sanitize(dirtySnippet, SEARCH_SNIPPET_CONFIG);
}

const ALLOWED_TIPTAP_NODES = new Set([
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'taskList',
  'taskItem',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'hardBreak',
  'table',
  'tableRow',
  'tableHeader',
  'tableCell',
]);

const ALLOWED_TIPTAP_MARKS = new Set([
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'link',
]);

function sanitizeJsonNode(node: Json): Json | null {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    return null;
  }

  const record = node as Record<string, Json | undefined>;
  const nodeType = typeof record.type === 'string' ? record.type : '';
  if (!ALLOWED_TIPTAP_NODES.has(nodeType)) {
    return null;
  }

  const cleanNode: Record<string, Json | undefined> = { type: nodeType };

  if (typeof record.text === 'string') {
    cleanNode.text = record.text;
  }

  if (typeof record.attrs === 'object' && record.attrs !== null && !Array.isArray(record.attrs)) {
    cleanNode.attrs = record.attrs;
  }

  if (Array.isArray(record.marks)) {
    const cleanMarks = record.marks
      .map((mark): Json | null => {
        if (typeof mark !== 'object' || mark === null || Array.isArray(mark)) return null;
        const m = mark as Record<string, Json | undefined>;
        const markType = typeof m.type === 'string' ? m.type : '';
        if (!ALLOWED_TIPTAP_MARKS.has(markType)) return null;

        if (markType === 'link') {
          const attrs =
            typeof m.attrs === 'object' && m.attrs !== null && !Array.isArray(m.attrs)
              ? (m.attrs as Record<string, Json | undefined>)
              : {};
          const href = typeof attrs.href === 'string' ? attrs.href : '';
          if (!isSafeUrl(href)) return null;
          return {
            type: 'link',
            attrs: {
              href: href.trim(),
              target: '_blank',
              rel: 'noopener noreferrer nofollow',
            },
          };
        }

        return m.attrs ? { type: markType, attrs: m.attrs } : { type: markType };
      })
      .filter((m): m is Json => m !== null);

    if (cleanMarks.length > 0) {
      cleanNode.marks = cleanMarks;
    }
  }

  if (Array.isArray(record.content)) {
    cleanNode.content = record.content
      .map(sanitizeJsonNode)
      .filter((child): child is Json => child !== null);
  }

  return cleanNode;
}

/**
 * Strips non-whitelisted Tiptap node types, marks, and unsafe link hrefs
 * from a JSON document before saving to Supabase.
 */
export function sanitizeTiptapDoc(doc: TiptapDoc): TiptapDoc {
  const sanitized = sanitizeJsonNode(doc as unknown as Json);
  if (
    sanitized &&
    typeof sanitized === 'object' &&
    !Array.isArray(sanitized) &&
    (sanitized as Record<string, Json | undefined>).type === 'doc'
  ) {
    return sanitized as unknown as TiptapDoc;
  }
  return { type: 'doc', content: [] };
}