import { describe, expect, it } from 'vitest';
import { sanitizeRichHtml, sanitizeSearchSnippet, sanitizeTiptapDoc } from '@/lib/sanitize';

describe('DOMPurify & Tiptap XSS sanitization', () => {
  it('strips <script> tags, event handlers, and javascript: URLs from rich HTML', () => {
    const dirty =
      '<p onclick="alert(1)">Hello</p><script>evil()</script><a href="javascript:alert(2)">Bad</a><a href="https://example.com">Good</a>';
    const clean = sanitizeRichHtml(dirty);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('<p>Hello</p>');
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('rel="noopener noreferrer nofollow"');
  });

  it('keeps only highlight tags in search snippets', () => {
    const dirtySnippet = '<mark>cozy</mark> <img src=x onerror=alert(1)> <b>note</b>';
    const cleanSnippet = sanitizeSearchSnippet(dirtySnippet);

    expect(cleanSnippet).toContain('<mark>cozy</mark>');
    expect(cleanSnippet).toContain('<b>note</b>');
    expect(cleanSnippet).not.toContain('<img');
    expect(cleanSnippet).not.toContain('onerror');
  });

  it('strips non-whitelisted Tiptap nodes and unsafe link marks from TiptapDoc', () => {
    const dirtyDoc = {
      type: 'doc' as const,
      content: [
        { type: 'image', attrs: { src: 'https://evil.com/x.png' } },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Click',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    };

    const sanitized = sanitizeTiptapDoc(dirtyDoc);
    expect(sanitized.content).toHaveLength(1);
    expect(sanitized.content?.[0]?.type).toBe('paragraph');
    expect(sanitized.content?.[0]?.content?.[0]?.marks).toBeUndefined();
  });
});