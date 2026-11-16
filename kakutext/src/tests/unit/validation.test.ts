import { describe, expect, it } from 'vitest';
import {
  MAX_NOTE_JSON_BYTES,
  MAX_NOTE_TITLE_LENGTH,
  createFolderSchema,
  isSafeUrl,
  searchNotesParamsSchema,
  updateNoteSchema,
} from '@/lib/validation';

describe('Zod validation boundary schemas', () => {
  it('accepts a valid note update at title boundary (200 chars)', () => {
    const validTitle = 'a'.repeat(MAX_NOTE_TITLE_LENGTH);
    const result = updateNoteSchema.safeParse({
      title: validTitle,
      content_json: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello cozy world' }] }],
      },
      content_text: 'Hello cozy world',
    });

    expect(result.success).toBe(true);
  });

  it('rejects note titles exceeding 200 characters', () => {
    const result = updateNoteSchema.safeParse({
      title: 'a'.repeat(MAX_NOTE_TITLE_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it('rejects content_json exceeding 1 MB', () => {
    const oversizedText = 'x'.repeat(MAX_NOTE_JSON_BYTES + 100);
    const result = updateNoteSchema.safeParse({
      content_json: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: oversizedText }] }],
      },
    });

    expect(result.success).toBe(false);
  });

  it('validates folder names and hex colors', () => {
    expect(createFolderSchema.safeParse({ name: 'Study Notes', color: '#F4A84E' }).success).toBe(
      true
    );
    expect(createFolderSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(createFolderSchema.safeParse({ name: 'a'.repeat(51) }).success).toBe(false);
    expect(createFolderSchema.safeParse({ name: 'Work', color: 'not-a-hex' }).success).toBe(false);
  });

  it('validates search query params (1 to 200 chars)', () => {
    expect(searchNotesParamsSchema.safeParse({ q: '  kaku notes  ' }).success).toBe(true);
    expect(searchNotesParamsSchema.safeParse({ q: '' }).success).toBe(false);
    expect(searchNotesParamsSchema.safeParse({ q: 'q'.repeat(201) }).success).toBe(false);
  });

  it('allows only safe http, https, and mailto URLs', () => {
    expect(isSafeUrl('https://kakutext.app')).toBe(true);
    expect(isSafeUrl('http://localhost:5173')).toBe(true);
    expect(isSafeUrl('mailto:hello@kakutext.app')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });
});