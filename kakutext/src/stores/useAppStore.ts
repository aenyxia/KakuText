import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import type { MascotMood } from '@/components/mascot/KakuMascot';

export type { MascotMood };
export type ThemeMode = 'light' | 'dark';
export type AutosaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict';

export interface Folder {
  id: string;
  name: string;
  color: string | null;
}

export interface NoteSummary {
  id: string;
  title: string;
  content_text?: string;
  pinned: boolean;
  favorited: boolean;
  folder_id: string | null;
  updated_at: string;
}

const THEME_STORAGE_KEY = 'kakutext-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export interface AppState {
  session: Session | null;
  authReady: boolean;
  theme: ThemeMode;
  isDrawerOpen: boolean;
  activeFolderId: string | null;
  onlyFavorites: boolean;
  searchQuery: string;
  openTabIds: string[];
  autosaveStatus: AutosaveStatus;
  lastSavedAt: string | null;
  mascotMood: MascotMood;

  setSession: (session: Session | null) => void;
  resetOnSignOut: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  setFilter: (filter: { folderId: string | null; onlyFavorites: boolean }) => void;
  setActiveFolderId: (folderId: string | null) => void;
  setOnlyFavorites: (onlyFavorites: boolean) => void;
  setSearchQuery: (query: string) => void;
  openTab: (noteId: string) => void;
  closeTab: (noteId: string) => void;
  setAutosaveStatus: (status: AutosaveStatus, savedAt?: string | null) => void;
  setMascotMood: (mood: MascotMood) => void;
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  authReady: false,
  theme: getInitialTheme(),
  isDrawerOpen: false,
  activeFolderId: null,
  onlyFavorites: false,
  searchQuery: '',
  openTabIds: [],
  autosaveStatus: 'idle',
  lastSavedAt: null,
  mascotMood: 'happy',

  setSession: (session) => set({ session, authReady: true }),

  resetOnSignOut: () =>
    set({
      session: null,
      authReady: true,
      isDrawerOpen: false,
      activeFolderId: null,
      onlyFavorites: false,
      searchQuery: '',
      openTabIds: [],
      autosaveStatus: 'idle',
      lastSavedAt: null,
      mascotMood: 'happy',
    }),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const next: ThemeMode = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      }
      return { theme: next };
    }),

  setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  setFilter: ({ folderId, onlyFavorites }) =>
    set({
      activeFolderId: folderId,
      onlyFavorites,
    }),

  setActiveFolderId: (activeFolderId) => set({ activeFolderId, onlyFavorites: false }),
  setOnlyFavorites: (onlyFavorites) => set({ onlyFavorites, activeFolderId: null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  openTab: (noteId) =>
    set((state) => ({
      openTabIds: state.openTabIds.includes(noteId)
        ? state.openTabIds
        : [...state.openTabIds.slice(-7), noteId],
    })),

  closeTab: (noteId) =>
    set((state) => ({
      openTabIds: state.openTabIds.filter((id) => id !== noteId),
    })),

  setAutosaveStatus: (autosaveStatus, savedAt) =>
    set((state) => ({
      autosaveStatus,
      lastSavedAt: savedAt !== undefined ? savedAt : state.lastSavedAt,
    })),

  setMascotMood: (mascotMood) => set({ mascotMood }),
}));