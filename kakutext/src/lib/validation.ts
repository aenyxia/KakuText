import { z } from 'zod';
import type { TiptapDoc, TiptapNode } from '@/lib/database.types';

export const MAX_NOTE_TITLE_LENGTH = 200;
export const MAX_NOTE_TEXT_LENGTH = 200_000;
export const MAX_NOTE_JSON_BYTES = 1_048_576; // 1 MiB (matches octet_length <= 1048576)
export const MAX_FOLDER_NAME_LENGTH = 50;
export const MAX_DISPLAY_NAME_LENGTH = 50;

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const SAFE_PROTOCOL_REGEX = /^(https?:|mailto:)/i;
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/;

/**
 * Validates that a link href uses an allowlisted protocol (http, https, mailto)
 * or a safe relative path/fragment, blocking javascript:, data:, and vbscript:.
 */
export function isSafeUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return true;
  }

  const normalized = trimmed.replace(/[\u0000-\u0020]+/g, '');
  if (!SAFE_PROTOCOL_REGEX.test(normalized)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
  } catch {
    return false;
  }
}

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export const safeLinkUrlSchema = z
  .string()
  .trim()
  .min(1, 'URL cannot be empty.')
  .max(2048, 'URL is too long.')
  .refine(isSafeUrl, 'Only http://, https://, mailto:, or relative links are allowed.');

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, 'Display name is required.')
    .max(MAX_DISPLAY_NAME_LENGTH, `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`)
    .refine((val) => !CONTROL_CHARS_REGEX.test(val), {
      message: 'Display name cannot contain control characters.',
    }),
  theme: z.enum(['light', 'dark']),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const folderNameSchema = z
  .string()
  .trim()
  .min(1, 'Folder name is required.')
  .max(MAX_FOLDER_NAME_LENGTH, `Folder name must be ${MAX_FOLDER_NAME_LENGTH} characters or fewer.`)
  .refine((val) => !CONTROL_CHARS_REGEX.test(val), {
    message: 'Folder name cannot contain control characters.',
  });

export const folderColorSchema = z
  .string()
  .regex(HEX_COLOR_REGEX, 'Color must be a 6-digit hex code (e.g., #F4A84E).')
  .nullable()
  .optional();

export const createFolderSchema = z.object({
  name: folderNameSchema,
  color: folderColorSchema,
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export const updateFolderSchema = z
  .object({
    name: folderNameSchema.optional(),
    color: folderColorSchema,
  })
  .refine((data) => data.name !== undefined || data.color !== undefined, {
    message: 'At least one folder field must be provided.',
  });

export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

const tiptapNodeSchema = z.custom<TiptapNode>(
  (val): val is TiptapNode => typeof val === 'object' && val !== null && !Array.isArray(val),
  'Invalid document node.'
);

export const tiptapDocSchema: z.ZodType<TiptapDoc> = z
  .object({
    type: z.literal('doc'),
    content: z.array(tiptapNodeSchema).optional(),
  })
  .passthrough()
  .refine(
    (doc) => getUtf8ByteLength(JSON.stringify(doc)) <= MAX_NOTE_JSON_BYTES,
    'Note formatting data exceeds the 1 MB maximum size.'
  );

export const noteTitleSchema = z
  .string()
  .max(MAX_NOTE_TITLE_LENGTH, `Title must be ${MAX_NOTE_TITLE_LENGTH} characters or fewer.`);

export const noteContentTextSchema = z
  .string()
  .max(MAX_NOTE_TEXT_LENGTH, `Note text exceeds ${MAX_NOTE_TEXT_LENGTH.toLocaleString()} characters.`);

export const createNoteSchema = z.object({
  title: noteTitleSchema.default(''),
  content_json: tiptapDocSchema.default({ type: 'doc', content: [] }),
  content_text: noteContentTextSchema.default(''),
  folder_id: z.string().uuid('Invalid folder ID.').nullable().optional(),
  pinned: z.boolean().optional(),
  favorited: z.boolean().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  title: noteTitleSchema.optional(),
  content_json: tiptapDocSchema.optional(),
  content_text: noteContentTextSchema.optional(),
  folder_id: z.string().uuid('Invalid folder ID.').nullable().optional(),
  pinned: z.boolean().optional(),
  favorited: z.boolean().optional(),
  deleted_at: z.string().datetime({ offset: true }).nullable().optional(),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const NoteUpdate = updateNoteSchema;

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Enter at least 1 character to search.')
    .max(100, 'Search query must be 100 characters or fewer.'),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

export const searchNotesParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search query cannot be empty.')
    .max(200, 'Search query must be 200 characters or fewer.'),
  lim: z.number().int().min(1).max(50).default(20),
  folder: z.string().uuid('Invalid folder ID.').nullable().optional(),
});

export type SearchNotesParamsInput = z.infer<typeof searchNotesParamsSchema>;