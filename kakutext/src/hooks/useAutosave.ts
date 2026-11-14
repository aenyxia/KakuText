import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Editor } from '@tiptap/react';
import { useDebouncedCallback } from 'use-debounce';
import { normalizeTiptapDoc } from '@/components/editor/TiptapConfig';
import type { Json, TiptapDoc } from '@/lib/database.types';
import { sanitizeTiptapDoc } from '@/lib/sanitize';
import { supabase } from '@/lib/supabase';
import { MAX_NOTE_TEXT_LENGTH, MAX_NOTE_TITLE_LENGTH, NoteUpdate } from '@/lib/validation';
import { useAppStore } from '@/stores/useAppStore';

const MAX_RETRY_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 1000;

export interface ServerConflictNote {
  id: string;
  title: string;
  content_json: Json;
  content_text: string;
  updated_at: string;
}

export interface UseAutosaveOptions {
  noteId: string | undefined;
  editor: Editor | null;
  title: string;
  initialUpdatedAt: string | undefined;
  onTitleSyncedFromServer: (serverTitle: string) => void;
}

export interface UseAutosaveResult {
  lastSeenUpdatedAt: string;
  conflictServerNote: ServerConflictNote | null;
  isResolvingConflict: boolean;
  notifyTitleChanged: (nextTitle: string) => void;
  flushSave: () => void;
  retryNow: () => void;
  resolveKeepLocal: () => Promise<void>;
  resolveAcceptServer: () => void;
}

export function useAutosave({
  noteId,
  editor,
  title,
  initialUpdatedAt,
  onTitleSyncedFromServer,
}: UseAutosaveOptions): UseAutosaveResult {
  const queryClient = useQueryClient();
  const setAutosaveStatus = useAppStore((s) => s.setAutosaveStatus);
  const setMascotMood = useAppStore((s) => s.setMascotMood);

  const lastSeenRef = useRef<string>(initialUpdatedAt ?? '');
  const latestTitleRef = useRef<string>(title);
  const isDirtyRef = useRef<boolean>(false);
  const inFlightRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const retryTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const [conflictServerNote, setConflictServerNote] = useState<ServerConflictNote | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState<boolean>(false);

  latestTitleRef.current = title;

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // Sync baseline timestamp when switching notes
  useEffect(() => {
    lastSeenRef.current = initialUpdatedAt ?? '';
    isDirtyRef.current = false;
    inFlightRef.current = false;
    pendingSaveRef.current = false;
    retryCountRef.current = 0;
    clearRetryTimer();
    setConflictServerNote(null);
    setAutosaveStatus(initialUpdatedAt ? 'saved' : 'idle', initialUpdatedAt ?? null);
    setMascotMood('happy');
  }, [noteId, initialUpdatedAt, clearRetryTimer, setAutosaveStatus, setMascotMood]);

  const executeSaveRef = useRef<() => Promise<void>>(async () => {});

  const executeSave = useCallback(async () => {
    if (!noteId || !editor || editor.isDestroyed || !lastSeenRef.current) {
      return;
    }

    if (!isDirtyRef.current) {
      return;
    }

    if (inFlightRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    inFlightRef.current = true;
    pendingSaveRef.current = false;
    clearRetryTimer();

    if (isMountedRef.current) {
      setAutosaveStatus('saving');
      setMascotMood('saving');
    }

    const sanitizedDoc = sanitizeTiptapDoc(editor.getJSON() as TiptapDoc);
    const rawText = editor.getText({ blockSeparator: '\n' }).slice(0, MAX_NOTE_TEXT_LENGTH);
    const trimmedTitle = latestTitleRef.current.slice(0, MAX_NOTE_TITLE_LENGTH);

    const parsed = NoteUpdate.safeParse({
      title: trimmedTitle,
      content_json: sanitizedDoc,
      content_text: rawText,
    });

    if (!parsed.success) {
      inFlightRef.current = false;
      if (isMountedRef.current) {
        setAutosaveStatus('error');
        setMascotMood('sleepy');
      }
      return;
    }

    // Clear dirty flag right before transmission; new keystrokes during flight set it true again
    isDirtyRef.current = false;

    const { data, error } = await supabase
      .from('notes')
      .update({
        title: parsed.data.title,
        content_json: parsed.data.content_json as unknown as Json,
        content_text: parsed.data.content_text,
      })
      .eq('id', noteId)
      .eq('updated_at', lastSeenRef.current)
      .select('id, title, content_json, content_text, updated_at');

    inFlightRef.current = false;

    if (error) {
      isDirtyRef.current = true;
      const isRateLimited = error.code === '429' || error.message.includes('429');

      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        const attempt = retryCountRef.current;
        retryCountRef.current += 1;
        const backoffMs = BASE_RETRY_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250);

        if (isMountedRef.current) {
          setAutosaveStatus('dirty');
          setMascotMood(isRateLimited ? 'slowdown' : 'thinking');
        }

        retryTimerRef.current = window.setTimeout(() => {
          void executeSaveRef.current();
        }, backoffMs);
      } else if (isMountedRef.current) {
        setAutosaveStatus('error');
        setMascotMood(isRateLimited ? 'slowdown' : 'sleepy');
      }
      return;
    }

    // Zero rows updated => updated_at changed on server (optimistic concurrency conflict)
    if (!data || data.length === 0) {
      isDirtyRef.current = true;
      pendingSaveRef.current = false;

      const { data: latestServer } = await supabase
        .from('notes')
        .select('id, title, content_json, content_text, updated_at')
        .eq('id', noteId)
        .maybeSingle();

      if (isMountedRef.current) {
        if (latestServer) {
          setConflictServerNote(latestServer);
        }
        setAutosaveStatus('conflict');
        setMascotMood('thinking');
      }
      return;
    }

    const updatedRow = data[0];
    lastSeenRef.current = updatedRow.updated_at;
    retryCountRef.current = 0;

    queryClient.setQueryData(['note', noteId], (prev: Record<string, unknown> | undefined) =>
      prev ? { ...prev, ...updatedRow } : updatedRow
    );
    void queryClient.invalidateQueries({ queryKey: ['notes'] });

    if (isMountedRef.current) {
      setAutosaveStatus('saved', updatedRow.updated_at);
      setMascotMood('happy');
    }

    // If edits occurred while PATCH was in flight, immediately persist the latest draft
    if (pendingSaveRef.current || isDirtyRef.current) {
      pendingSaveRef.current = false;
      void executeSaveRef.current();
    }
  }, [noteId, editor, clearRetryTimer, queryClient, setAutosaveStatus, setMascotMood]);

  executeSaveRef.current = executeSave;

  const debouncedSave = useDebouncedCallback(() => {
    void executeSaveRef.current();
  }, 1000);

  const markDirtyAndSchedule = useCallback(() => {
    if (!noteId || !lastSeenRef.current) return;
    isDirtyRef.current = true;
    setAutosaveStatus('dirty');
    debouncedSave();
  }, [noteId, setAutosaveStatus, debouncedSave]);

  const notifyTitleChanged = useCallback(
    (nextTitle: string) => {
      latestTitleRef.current = nextTitle;
      markDirtyAndSchedule();
    },
    [markDirtyAndSchedule]
  );

  const flushSave = useCallback(() => {
    if (isDirtyRef.current) {
      debouncedSave.flush();
    }
  }, [debouncedSave]);

  const retryNow = useCallback(() => {
    clearRetryTimer();
    retryCountRef.current = 0;
    isDirtyRef.current = true;
    void executeSaveRef.current();
  }, [clearRetryTimer]);

  const resolveKeepLocal = useCallback(async () => {
    if (!conflictServerNote) return;
    setIsResolvingConflict(true);
    lastSeenRef.current = conflictServerNote.updated_at;
    setConflictServerNote(null);
    isDirtyRef.current = true;
    retryCountRef.current = 0;
    await executeSaveRef.current();
    if (isMountedRef.current) {
      setIsResolvingConflict(false);
    }
  }, [conflictServerNote]);

  const resolveAcceptServer = useCallback(() => {
    if (!conflictServerNote || !editor || editor.isDestroyed) return;
    debouncedSave.cancel();
    clearRetryTimer();

    const cleanServerDoc = normalizeTiptapDoc(conflictServerNote.content_json);
    editor.commands.setContent(cleanServerDoc, false);
    latestTitleRef.current = conflictServerNote.title;
    onTitleSyncedFromServer(conflictServerNote.title);

    lastSeenRef.current = conflictServerNote.updated_at;
    isDirtyRef.current = false;
    pendingSaveRef.current = false;
    retryCountRef.current = 0;
    setConflictServerNote(null);

    if (noteId) {
      queryClient.setQueryData(['note', noteId], (prev: Record<string, unknown> | undefined) =>
        prev ? { ...prev, ...conflictServerNote } : conflictServerNote
      );
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    }

    setAutosaveStatus('saved', conflictServerNote.updated_at);
    setMascotMood('happy');
  }, [
    conflictServerNote,
    editor,
    debouncedSave,
    clearRetryTimer,
    onTitleSyncedFromServer,
    noteId,
    queryClient,
    setAutosaveStatus,
    setMascotMood,
  ]);

  // Subscribe to Tiptap onUpdate and onBlur
  useEffect(() => {
    if (!editor) return;

    const handleEditorUpdate = () => {
      markDirtyAndSchedule();
    };

    const handleEditorBlur = () => {
      flushSave();
    };

    editor.on('update', handleEditorUpdate);
    editor.on('blur', handleEditorBlur);

    return () => {
      editor.off('update', handleEditorUpdate);
      editor.off('blur', handleEditorBlur);
    };
  }, [editor, markDirtyAndSchedule, flushSave]);

  // Flush immediately when browser tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushSave]);

  // Flush immediately on route change / unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      flushSave();
      clearRetryTimer();
      isMountedRef.current = false;
    };
  }, [flushSave, clearRetryTimer]);

  return {
    lastSeenUpdatedAt: lastSeenRef.current,
    conflictServerNote,
    isResolvingConflict,
    notifyTitleChanged,
    flushSave,
    retryNow,
    resolveKeepLocal,
    resolveAcceptServer,
  };
}