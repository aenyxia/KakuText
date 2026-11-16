import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from '@tiptap/react';
import { useAutosave } from '@/hooks/useAutosave';
import { useAppStore } from '@/stores/useAppStore';

const mockUpdate = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

function createMockEditor(text = 'Initial body'): Editor {
  const listeners = new Map<string, Set<() => void>>();
  return {
    isDestroyed: false,
    getJSON: () => ({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    }),
    getText: () => text,
    on: (event: string, fn: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(fn);
    },
    off: (event: string, fn: () => void) => {
      listeners.get(event)?.delete(fn);
    },
    emit: (event: string) => {
      listeners.get(event)?.forEach((fn) => fn());
    },
  } as unknown as Editor;
}

describe('useAutosave state machine (debounce, conflict, retry)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useAppStore.setState({ autosaveStatus: 'idle', mascotMood: 'happy' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces edits by 1000ms and transitions dirty -> saving -> saved', async () => {
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'note-1', updated_at: '2026-01-01T00:01:00.000Z' }],
              error: null,
            }),
          }),
        }),
      }),
    });

    const editor = createMockEditor('Hello autosave');
    const { result } = renderHook(() =>
      useAutosave({
        noteId: 'note-1',
        editor,
        title: 'First Title',
        initialUpdatedAt: '2026-01-01T00:00:00.000Z',
        onTitleSyncedFromServer: vi.fn(),
      })
    );

    act(() => {
      result.current.notifyTitleChanged('Updated Title');
    });

    expect(useAppStore.getState().autosaveStatus).toBe('dirty');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(useAppStore.getState().autosaveStatus).toBe('saved');
    expect(result.current.lastSeenUpdatedAt).toBe('2026-01-01T00:01:00.000Z');
  });

  it('detects optimistic concurrency conflict when conditional PATCH updates 0 rows', async () => {
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    });

    const editor = createMockEditor('Conflicting edit');
    const { result } = renderHook(() =>
      useAutosave({
        noteId: 'note-1',
        editor,
        title: 'Local Title',
        initialUpdatedAt: '2026-01-01T00:00:00.000Z',
        onTitleSyncedFromServer: vi.fn(),
      })
    );

    act(() => {
      result.current.notifyTitleChanged('Local Title v2');
      result.current.flushSave();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(useAppStore.getState().autosaveStatus).toBe('conflict');
  });
});