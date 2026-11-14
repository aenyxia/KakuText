import type { Editor, JSONContent } from '@tiptap/react';

export interface DocumentMetrics {
  wordCount: number;
  characterCount: number;
}

export function computeDocumentMetrics(plainText: string): DocumentMetrics {
  const trimmed = plainText.trim();
  if (!trimmed) {
    return { wordCount: 0, characterCount: 0 };
  }

  return {
    wordCount: trimmed.split(/\s+/).length,
    characterCount: trimmed.length,
  };
}

export function slugifyNoteTitle(title: string): string {
  const normalized = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

  return normalized || 'untitled-note';
}

function serializeInlineNodes(nodes?: JSONContent[]): string {
  if (!nodes || nodes.length === 0) return '';

  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '  \n';
      if (node.type !== 'text') return serializeNode(node);

      let text = node.text ?? '';
      const marks = node.marks ?? [];
      for (const mark of marks) {
        if (mark.type === 'bold') {
          text = `**${text}**`;
        } else if (mark.type === 'italic') {
          text = `*${text}*`;
        } else if (mark.type === 'underline') {
          text = `<u>${text}</u>`;
        } else if (mark.type === 'link' && typeof mark.attrs?.href === 'string') {
          text = `[${text}](${mark.attrs.href})`;
        }
      }
      return text;
    })
    .join('');
}

function serializeNode(node: JSONContent, listDepth = 0, orderedIndex?: number): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? [])
        .map((child) => serializeNode(child))
        .filter((chunk) => chunk.length > 0)
        .join('\n\n');

    case 'paragraph':
      return serializeInlineNodes(node.content);

    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 3);
      return `${'#'.repeat(level)} ${serializeInlineNodes(node.content)}`;
    }

    case 'bulletList':
      return (node.content ?? [])
        .map((item) => serializeNode(item, listDepth))
        .join('\n');

    case 'orderedList':
      return (node.content ?? [])
        .map((item, idx) => serializeNode(item, listDepth, idx + 1))
        .join('\n');

    case 'taskList':
      return (node.content ?? [])
        .map((item) => serializeNode(item, listDepth))
        .join('\n');

    case 'listItem': {
      const indent = '  '.repeat(listDepth);
      const marker = orderedIndex !== undefined ? `${orderedIndex}.` : '-';
      const children = node.content ?? [];
      const firstLine = children[0] ? serializeNode(children[0], listDepth + 1) : '';
      const nested = children
        .slice(1)
        .map((child) => serializeNode(child, listDepth + 1))
        .join('\n');
      return nested ? `${indent}${marker} ${firstLine}\n${nested}` : `${indent}${marker} ${firstLine}`;
    }

    case 'taskItem': {
      const indent = '  '.repeat(listDepth);
      const checked = Boolean(node.attrs?.checked);
      const marker = checked ? '- [x]' : '- [ ]';
      const children = node.content ?? [];
      const firstLine = children[0] ? serializeNode(children[0], listDepth + 1) : '';
      const nested = children
        .slice(1)
        .map((child) => serializeNode(child, listDepth + 1))
        .join('\n');
      return nested ? `${indent}${marker} ${firstLine}\n${nested}` : `${indent}${marker} ${firstLine}`;
    }

    case 'table': {
      const rows = node.content ?? [];
      if (rows.length === 0) return '';
      const matrix = rows.map((row) =>
        (row.content ?? []).map((cell) =>
          (cell.content ?? [])
            .map((p) => serializeNode(p))
            .join(' ')
            .replace(/\|/g, '\\|')
            .trim()
        )
      );
      const header = `| ${matrix[0].join(' | ')} |`;
      const divider = `| ${matrix[0].map(() => '---').join(' | ')} |`;
      const body = matrix.slice(1).map((r) => `| ${r.join(' | ')} |`);
      return [header, divider, ...body].join('\n');
    }

    default:
      return serializeInlineNodes(node.content);
  }
}

export function serializeTiptapJsonToMarkdown(doc: JSONContent, title?: string): string {
  const body = serializeNode(doc).trim();
  const cleanTitle = title?.trim();
  if (cleanTitle) {
    return body ? `# ${cleanTitle}\n\n${body}\n` : `# ${cleanTitle}\n`;
  }
  return body ? `${body}\n` : '';
}

function triggerBrowserDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function exportNoteToMarkdown(editor: Editor, title: string): string {
  const storageMarkdown = (
    editor.storage as { markdown?: { getMarkdown?: () => string } }
  ).markdown?.getMarkdown;

  const rawBody =
    typeof storageMarkdown === 'function'
      ? storageMarkdown().trim()
      : serializeNode(editor.getJSON()).trim();

  const cleanTitle = title.trim();
  const markdown = cleanTitle
    ? rawBody
      ? `# ${cleanTitle}\n\n${rawBody}\n`
      : `# ${cleanTitle}\n`
    : rawBody
      ? `${rawBody}\n`
      : '';

  const filename = `${slugifyNoteTitle(title)}.md`;
  triggerBrowserDownload(markdown, filename, 'text/markdown;charset=utf-8');
  return filename;
}

export function exportNoteToPlainText(editor: Editor, title: string): string {
  const body = editor.getText({ blockSeparator: '\n' }).trim();
  const cleanTitle = title.trim();
  const text = cleanTitle
    ? body
      ? `${cleanTitle}\n\n${body}\n`
      : `${cleanTitle}\n`
    : body
      ? `${body}\n`
      : '';

  const filename = `${slugifyNoteTitle(title)}.txt`;
  triggerBrowserDownload(text, filename, 'text/plain;charset=utf-8');
  return filename;
}