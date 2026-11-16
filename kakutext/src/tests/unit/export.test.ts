import { describe, expect, it } from 'vitest';
import {
  computeDocumentMetrics,
  serializeTiptapJsonToMarkdown,
} from '@/lib/export';
import type { TiptapDoc } from '@/lib/database.types';

describe('Document metrics and client-side Markdown serialization', () => {
  it('computes accurate word and character counts', () => {
    expect(computeDocumentMetrics('')).toEqual({ wordCount: 0, characterCount: 0 });
    expect(computeDocumentMetrics('  Quiet heart,   kind soul.  ')).toEqual({
      wordCount: 4,
      characterCount: 29,
    });
  });

  it('serializes Tiptap JSON headings, lists, checklists, and marks into Markdown', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Study Plan' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and ' },
            { type: 'text', text: 'Italic', marks: [{ type: 'italic' }] },
          ],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Done task' }] }],
            },
          ],
        },
      ],
    };

    const markdown = serializeTiptapJsonToMarkdown(doc);
    expect(markdown).toContain('## Study Plan');
    expect(markdown).toContain('**Bold**');
    expect(markdown).toContain('*Italic*');
    expect(markdown).toContain('[x] Done task');
  });
});