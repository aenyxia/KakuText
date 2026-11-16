import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor } from '@tiptap/react';
import { useAutosave } from '@/hooks/useAutosave';
import { useAppStore } from '@/stores/useAppStore';

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
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
    commands: {
      setContent: vi.fn(),
    },
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
  let queryClient: QueryClient;

  function createWrapper() {
    return function Wrapper({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children);
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    useAppStore.setState({ autosaveStatus: 'idle', lastSavedAt: null, mascotMood: 'happy' });
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
  });

  it('debounces edits by 1000ms and transitions dirty -> saving -> saved', async () => {
    let resolvePatch!: (value: {
      data: Array<{ id: string; title: string; content_json: unknown; content_text: string; updated_at: string }>;
      error: null;
    }) => void;

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue(
              new Promise((resolve) => {
                resolvePatch = resolve;
              })
            ),
          }),
        }),
      }),
    });

    const editor = createMockEditor('Hello autosave');
    const hookProps = {
      noteId: 'note-1',
      editor,
      title: 'First Title',
      initialUpdatedAt: '2026-01-01T00:00:00.000Z',
      onTitleSyncedFromServer: vi.fn(),
    };

    const { result, rerender } = renderHook((props) => useAutosave(props), {
      initialProps: hookProps,
      wrapper: createWrapper(),
    });

    // Subscribe after initial mount baseline sync ('idle' -> 'saved')
    const statusTransitions: string[] = [];
    const unsubscribe = useAppStore.subscribe((state, prevState) => {
      if (state.autosaveStatus !== prevState.autosaveStatus) {
        statusTransitions.push(state.autosaveStatus);
      }
    });

    act(() => {
      result.current.notifyTitleChanged('Updated Title');
    });

    expect(useAppStore.getState().autosaveStatus).toBe('dirty');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(useAppStore.getState().autosaveStatus).toBe('saving');

    await act(async () => {
      resolvePatch({
        data: [
          {
            id: 'note-1',
            title: 'Updated Title',
            content_json: editor.getJSON(),
            content_text: 'Hello autosave',
            updated_at: '2026-01-01T00:01:00.000Z',
          },
        ],
        error: null,
      });
    });

    unsubscribe();
    rerender({ ...hookProps, title: 'Updated Title' });

    expect(statusTransitions).toEqual(['dirty', 'saving', 'saved']);
    expect(useAppStore.getState().autosaveStatus).toBe('saved');
    expect(useAppStore.getState().lastSavedAt).toBe('2026-01-01T00:01:00.000Z');
    expect(result.current.lastSeenUpdatedAt).toBe('2026-01-01T00:01:00.000Z');
  });

  it('retries failed PATCH requests with backoff and recovers on subsequent success', async () => {
    const selectMock = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Network timeout', code: '503' },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'note-1',
            title: 'Recovered Title',
            content_json: { type: 'doc', content: [] },
            content_text: 'Retry body',
            updated_at: '2026-01-01T00:02:00.000Z',
          },
        ],
        error: null,
      });

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: selectMock,
          }),
        }),
      }),
    });

    const editor = createMockEditor('Retry body');
    const hookProps = {
      noteId: 'note-1',
      editor,
      title: 'Initial Title',
      initialUpdatedAt: '2026-01-01T00:00:00.000Z',
      onTitleSyncedFromServer: vi.fn(),
    };

    const { result, rerender } = renderHook((props) => useAutosave(props), {
      initialProps: hookProps,
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.notifyTitleChanged('Recovered Title');
      result.current.flushSave();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().autosaveStatus).toBe('dirty');

    // Advance past first exponential backoff window (1000ms + up to 250ms jitter)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });

    rerender({ ...hookProps, title: 'Recovered Title' });

    expect(selectMock).toHaveBeenCalledTimes(2);
    expect(useAppStore.getState().autosaveStatus).toBe('saved');
    expect(useAppStore.getState().lastSavedAt).toBe('2026-01-01T00:02:00.000Z');
    expect(result.current.lastSeenUpdatedAt).toBe('2026-01-01T00:02:00.000Z');
  });

  it('detects optimistic concurrency conflict when conditional PATCH updates 0 rows', async () => {
    const serverSnapshot = {
      id: 'note-1',
      title: 'Remote Tab Title',
      content_json: { type: 'doc', content: [] },
      content_text: 'Remote edit',
      updated_at: '2026-01-01T00:05:00.000Z',
    };

    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: serverSnapshot,
            error: null,
          }),
        }),
      }),
    });

    const editor = createMockEditor('Conflicting edit');
    const { result } = renderHook(
      () =>
        useAutosave({
          noteId: 'note-1',
          editor,
          title: 'Local Title',
          initialUpdatedAt: '2026-01-01T00:00:00.000Z',
          onTitleSyncedFromServer: vi.fn(),
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.notifyTitleChanged('Local Title v2');
      result.current.flushSave();
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useAppStore.getState().autosaveStatus).toBe('conflict');
    expect(result.current.conflictServerNote).toEqual(serverSnapshot);
    expect(result.current.lastSeenUpdatedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});