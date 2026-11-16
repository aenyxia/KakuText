import { describe, expect, it } from 'vitest';
import {
  buildExportFilename,
  computeDocumentMetrics,
  serializeTiptapDocToMarkdown,
  slugifyFilename,
} from '@/lib/export';
import type { TiptapDoc } from '@/lib/database.types';

describe('Document metrics and client-side Markdown/TXT export', () => {
  it('computes accurate word and character counts', () => {
    expect(computeDocumentMetrics('')).toEqual({ wordCount: 0, characterCount: 0 });
    expect(computeDocumentMetrics('   \n\t  ')).toEqual({ wordCount: 0, characterCount: 0 });
    expect(computeDocumentMetrics('  Quiet heart,   kind soul.  ')).toEqual({
      wordCount: 4,
      characterCount: 29,
    });
  });

  it('slugifies filenames safely up to 80 characters with untitled-note fallback', () => {
    expect(slugifyFilename('   ')).toBe('untitled-note');
    expect(slugifyFilename('My Cozy Study Notes! #1')).toBe('my-cozy-study-notes-1');
    expect(slugifyFilename('a'.repeat(120)).length).toBeLessThanOrEqual(80);
    expect(buildExportFilename('Lecture 01', 'md')).toBe('lecture-01.md');
    expect(buildExportFilename('', 'txt')).toBe('untitled-note.txt');
  });

  it('serializes Tiptap JSON headings, lists, checklists, tables, and marks into Markdown', () => {
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
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet item' }] }],
            },
          ],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ordered item' }] }],
            },
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
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic' }] }],
                },
                {
                  type: 'tableHeader',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'TypeScript' }] }],
                },
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Complete' }] }],
                },
              ],
            },
          ],
        },
      ],
    };

    const markdown = serializeTiptapDocToMarkdown(doc);
    expect(markdown).toContain('## Study Plan');
    expect(markdown).toContain('**Bold**');
    expect(markdown).toContain('*Italic*');
    expect(markdown).toContain('- Bullet item');
    expect(markdown).toContain('1. Ordered item');
    expect(markdown).toContain('[x] Done task');
    expect(markdown).toContain('| Topic | Status |');
    expect(markdown).toContain('| --- | --- |');
    expect(markdown).toContain('| TypeScript | Complete |');
  });
});