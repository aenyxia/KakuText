import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '@/lib/database.types';

const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? '';
const userAEmail = env.VITE_RLS_TEST_USER_A_EMAIL ?? '';
const userAPassword = env.VITE_RLS_TEST_USER_A_PASSWORD ?? '';
const userBEmail = env.VITE_RLS_TEST_USER_B_EMAIL ?? '';
const userBPassword = env.VITE_RLS_TEST_USER_B_PASSWORD ?? '';

const hasRlsTestEnv = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    userAEmail &&
    userAPassword &&
    userBEmail &&
    userBPassword
);

function createIsolatedClient(label: string): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: `kakutext-rls-${label}`,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

describe.skipIf(!hasRlsTestEnv)('MOD-013.2: Multi-User PostgreSQL RLS Verification Suite', () => {
  const anonClient = createIsolatedClient('anon');
  const userAClient = createIsolatedClient('user-a');
  const userBClient = createIsolatedClient('user-b');

  let userAId = '';
  let userBId = '';
  let userBFolderId = '';
  let userBNoteId = '';
  let userANoteId = '';

  const uniqueToken = `rls-${Date.now()}`;

  beforeAll(async () => {
    const authA = await userAClient.auth.signInWithPassword({
      email: userAEmail,
      password: userAPassword,
    });
    if (authA.error || !authA.data.user) {
      throw new Error(`Failed to sign in User A: ${authA.error?.message}`);
    }
    userAId = authA.data.user.id;

    const authB = await userBClient.auth.signInWithPassword({
      email: userBEmail,
      password: userBPassword,
    });
    if (authB.error || !authB.data.user) {
      throw new Error(`Failed to sign in User B: ${authB.error?.message}`);
    }
    userBId = authB.data.user.id;

    // Seed a folder and note owned by User B
    const { data: folderB, error: folderErr } = await userBClient
      .from('folders')
      .insert({ name: `Private Folder ${uniqueToken}`, color: '#F4A84E' })
      .select('id')
      .single();

    if (folderErr || !folderB) {
      throw new Error(`Failed to seed User B folder: ${folderErr?.message}`);
    }
    userBFolderId = folderB.id;

    const { data: noteB, error: noteBErr } = await userBClient
      .from('notes')
      .insert({
        title: `Secret Note B ${uniqueToken}`,
        content_text: `Confidential keyword ${uniqueToken} belonging to User B`,
        folder_id: userBFolderId,
      })
      .select('id')
      .single();

    if (noteBErr || !noteB) {
      throw new Error(`Failed to seed User B note: ${noteBErr?.message}`);
    }
    userBNoteId = noteB.id;

    // Seed a note owned by User A containing the same search token
    const { data: noteA, error: noteAErr } = await userAClient
      .from('notes')
      .insert({
        title: `Public-to-A Note ${uniqueToken}`,
        content_text: `Owned keyword ${uniqueToken} belonging to User A`,
      })
      .select('id')
      .single();

    if (noteAErr || !noteA) {
      throw new Error(`Failed to seed User A note: ${noteAErr?.message}`);
    }
    userANoteId = noteA.id;
  });

  afterAll(async () => {
    if (userANoteId) {
      await userAClient.from('notes').delete().eq('id', userANoteId);
    }
    if (userBNoteId) {
      await userBClient.from('notes').delete().eq('id', userBNoteId);
    }
    if (userBFolderId) {
      await userBClient.from('folders').delete().eq('id', userBFolderId);
    }
    await userAClient.auth.signOut();
    await userBClient.auth.signOut();
  });

  it('denies unauthenticated (anon) role access to profiles, folders, notes, and search_notes', async () => {
    const [profilesRes, foldersRes, notesRes, rpcRes] = await Promise.all([
      anonClient.from('profiles').select('*'),
      anonClient.from('folders').select('*'),
      anonClient.from('notes').select('*'),
      anonClient.rpc('search_notes', { q: uniqueToken }),
    ]);

    expect(profilesRes.data ?? []).toHaveLength(0);
    expect(foldersRes.data ?? []).toHaveLength(0);
    expect(notesRes.data ?? []).toHaveLength(0);
    expect(rpcRes.error).not.toBeNull();
  });

  it('allows User A to read own profile while blocking User B profiles, folders, and notes', async () => {
    const [ownProfileRes, otherProfileRes, folderRes, noteRes] = await Promise.all([
      userAClient.from('profiles').select('id').eq('id', userAId).maybeSingle(),
      userAClient.from('profiles').select('*').eq('id', userBId),
      userAClient.from('folders').select('*').eq('id', userBFolderId),
      userAClient.from('notes').select('*').eq('id', userBNoteId),
    ]);

    expect(ownProfileRes.error).toBeNull();
    expect(ownProfileRes.data?.id).toBe(userAId);

    expect(otherProfileRes.error).toBeNull();
    expect(otherProfileRes.data).toEqual([]);

    expect(folderRes.error).toBeNull();
    expect(folderRes.data).toEqual([]);

    expect(noteRes.error).toBeNull();
    expect(noteRes.data).toEqual([]);
  });

  it('prevents User A from UPDATEing or DELETEing User B notes and folders', async () => {
    const updateNoteRes = await userAClient
      .from('notes')
      .update({ title: 'Hacked by User A' })
      .eq('id', userBNoteId)
      .select('id');

    expect(updateNoteRes.data ?? []).toEqual([]);

    const deleteNoteRes = await userAClient
      .from('notes')
      .delete()
      .eq('id', userBNoteId)
      .select('id');

    expect(deleteNoteRes.data ?? []).toEqual([]);

    const updateFolderRes = await userAClient
      .from('folders')
      .update({ name: 'Hijacked Folder' })
      .eq('id', userBFolderId)
      .select('id');

    expect(updateFolderRes.data ?? []).toEqual([]);

    const deleteFolderRes = await userAClient
      .from('folders')
      .delete()
      .eq('id', userBFolderId)
      .select('id');

    expect(deleteFolderRes.data ?? []).toEqual([]);

    // Confirm User B data remains intact
    const verifyNoteB = await userBClient
      .from('notes')
      .select('title')
      .eq('id', userBNoteId)
      .single();

    expect(verifyNoteB.data?.title).toBe(`Secret Note B ${uniqueToken}`);
  });

  it('prevents User A from spoofing owner_id = User B on INSERT', async () => {
    const spoofNoteRes = await userAClient
      .from('notes')
      .insert({
        owner_id: userBId,
        title: 'Spoofed Owner Note',
        content_text: 'Should be rejected by RLS WITH CHECK',
      })
      .select('id');

    expect(spoofNoteRes.error).not.toBeNull();
    expect(spoofNoteRes.data).toBeNull();

    const spoofFolderRes = await userAClient
      .from('folders')
      .insert({
        owner_id: userBId,
        name: `Spoofed Folder ${uniqueToken}`,
      })
      .select('id');

    expect(spoofFolderRes.error).not.toBeNull();
    expect(spoofFolderRes.data).toBeNull();
  });

  it('prevents User A from assigning folder_id to User B folder on INSERT or UPDATE', async () => {
    const insertCrossFolderRes = await userAClient
      .from('notes')
      .insert({
        title: 'Cross-Tenant Folder Insert',
        folder_id: userBFolderId,
      })
      .select('id');

    expect(insertCrossFolderRes.error).not.toBeNull();
    expect(insertCrossFolderRes.data).toBeNull();

    const updateCrossFolderRes = await userAClient
      .from('notes')
      .update({ folder_id: userBFolderId })
      .eq('id', userANoteId)
      .select('id');

    expect(updateCrossFolderRes.error).not.toBeNull();
    expect(updateCrossFolderRes.data).toBeNull();
  });

  it('scopes search_notes RPC (SECURITY INVOKER) strictly to the caller own notes', async () => {
    const searchResA = await userAClient.rpc('search_notes', {
      q: uniqueToken,
      lim: 20,
    });

    expect(searchResA.error).toBeNull();
    const returnedIds = (searchResA.data ?? []).map((row) => row.id);
    expect(returnedIds).toContain(userANoteId);
    expect(returnedIds).not.toContain(userBNoteId);
  });
});