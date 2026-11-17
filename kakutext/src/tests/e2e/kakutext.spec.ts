import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

const testEmail = process.env.VITE_RLS_TEST_USER_A_EMAIL ?? '';
const testPassword = process.env.VITE_RLS_TEST_USER_A_PASSWORD ?? '';
const hasE2ECreds = Boolean(testEmail && testPassword);

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).fill(testPassword);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

function waitForNotesPatch(page: Page) {
  return page.waitForResponse(
    (res) =>
      res.url().includes('/rest/v1/notes') &&
      res.request().method() === 'PATCH' &&
      res.ok(),
    { timeout: 10_000 }
  );
}

test.describe('MOD-013.3: KakuText End-to-End Browser Suite', () => {
  test('redirects unauthenticated visitors on / to /login and renders signup form', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/signup');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
  });

  test.describe('Authenticated Workspace & Editor Flows', () => {
    test.skip(!hasE2ECreds, 'Requires VITE_RLS_TEST_USER_A_EMAIL and PASSWORD in .env.local');

    test('creates a note, autosaves edits, persists across reload, and exports .md', async ({
      page,
    }) => {
      const uniqueTitle = `E2E Cozy Note ${Date.now()}`;
      const bodyText = 'Quiet heart, kind soul — persisted via autosave.';

      await signIn(page);

      // Create a new note
      await page.getByRole('button', { name: /new cozy note/i }).first().click();
      await expect(page).toHaveURL(/\/notes\/[0-9a-f-]+$/i);

      // Step 1: Fill title and wait for its PATCH to finish before editing body
      const titleInput = page.getByLabel(/note title/i);
      await titleInput.fill(uniqueTitle);
      const titlePatchPromise = waitForNotesPatch(page);
      await titleInput.blur();
      await titlePatchPromise;

      // Step 2: Type full body text, then blur editor and wait for the body PATCH to finish
      const editor = page.getByLabel(/note body editor/i);
      await editor.click();
      await page.keyboard.type(bodyText);
      await expect(editor).toContainText(bodyText);

      const bodyPatchPromise = waitForNotesPatch(page);
      await titleInput.click();
      await bodyPatchPromise;

      await expect(page.getByText(/^Saved$/i).first()).toBeVisible({ timeout: 10_000 });

      // Reload page and confirm persistence from PostgreSQL
      await page.reload();
      await expect(page.getByLabel(/note title/i)).toHaveValue(uniqueTitle);
      await expect(page.getByLabel(/note body editor/i)).toContainText(bodyText);

      // Open Export menu and download Markdown (.md)
      await page.getByRole('banner').getByRole('button', { name: /export note/i }).click();
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('menuitem', { name: /download markdown/i }).click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/e2e-cozy-note-\d+\.md$/);
      const downloadPath = await download.path();
      if (downloadPath) {
        const exportedMarkdown = fs.readFileSync(downloadPath, 'utf-8');
        expect(exportedMarkdown).toContain(`# ${uniqueTitle}`);
        expect(exportedMarkdown).toContain(bodyText);
      }

      // Soft delete the note from editor header
      const deletePatchPromise = waitForNotesPatch(page);
      await page.getByRole('banner').getByRole('button', { name: /delete note/i }).click();
      await page.getByRole('dialog').getByRole('button', { name: /delete note/i }).click();
      await deletePatchPromise;

      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText(uniqueTitle)).toHaveCount(0);
    });

    test('supports pinning, favoriting, folder creation/filtering, and soft delete', async ({
      page,
      isMobile,
    }) => {
      const stamp = Date.now();
      const noteTitle = `Pinned Starred ${stamp}`;
      const folderName = `Study ${stamp}`;

      await signIn(page);

      // Create note and persist title
      await page.getByRole('button', { name: /new cozy note/i }).first().click();
      await expect(page).toHaveURL(/\/notes\/[0-9a-f-]+$/i);

      const titleInput = page.getByLabel(/note title/i);
      await titleInput.fill(noteTitle);
      const titleSavePromise = waitForNotesPatch(page);
      await titleInput.blur();
      await titleSavePromise;
      await expect(page.getByText(/^Saved$/i).first()).toBeVisible({ timeout: 10_000 });

      // Pin & Favorite from editor header and await server persistence
      const header = page.getByRole('banner');

      const pinPatchPromise = waitForNotesPatch(page);
      await header.getByRole('button', { name: /^pin note$/i }).click();
      await pinPatchPromise;
      await expect(header.getByRole('button', { name: /^unpin note$/i })).toBeVisible();

      const favPatchPromise = waitForNotesPatch(page);
      await header.getByRole('button', { name: /^add to favorites$/i }).click();
      await favPatchPromise;
      await expect(header.getByRole('button', { name: /^remove from favorites$/i })).toBeVisible();

      const openMobileDrawerIfNeeded = async () => {
        if (isMobile) {
          const drawer = page.getByRole('dialog', { name: /notes and folders navigation/i });
          if (!(await drawer.isVisible())) {
            await header.getByRole('button', { name: /toggle notes and folders menu/i }).click();
            await expect(drawer).toBeVisible();
          }
        }
      };

      const sidebar = isMobile
        ? page.getByRole('dialog', { name: /notes and folders navigation/i })
        : page.getByRole('complementary', { name: /workspace sidebar/i });

      // Filter by Favorites inside the sidebar (clicking closes mobile drawer automatically)
      await openMobileDrawerIfNeeded();
      await sidebar.getByRole('button', { name: 'Favorites', exact: true }).click();

      // Re-open mobile drawer to verify filtered list and create folder
      await openMobileDrawerIfNeeded();
      await expect(sidebar.getByRole('article').filter({ hasText: noteTitle })).toBeVisible({
        timeout: 10_000,
      });

      // Create a new folder and wait for POST /rest/v1/folders
      await sidebar.getByRole('button', { name: /create new folder/i }).click();
      const folderDialog = page.getByRole('dialog', { name: /new folder/i });
      await expect(folderDialog).toBeVisible();

      await folderDialog.getByLabel(/folder name/i).fill(folderName);
      const createFolderPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/rest/v1/folders') &&
          res.request().method() === 'POST' &&
          res.ok(),
        { timeout: 10_000 }
      );
      await folderDialog.getByRole('button', { name: /create folder/i }).click();
      await createFolderPromise;

      await expect(sidebar.getByRole('button', { name: folderName, exact: true })).toBeVisible({
        timeout: 10_000,
      });

      // Switch back to All Notes (closes mobile drawer automatically)
      await sidebar.getByRole('button', { name: 'All Notes', exact: true }).click();

      // Soft delete the test note from header
      const deletePatchPromise = waitForNotesPatch(page);
      await header.getByRole('button', { name: /delete note/i }).click();
      await page.getByRole('dialog').getByRole('button', { name: /delete note/i }).click();
      await deletePatchPromise;

      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText(noteTitle)).toHaveCount(0);

      // Clean up the test folder
      if (isMobile) {
        await header.getByRole('button', { name: /toggle notes and folders menu/i }).click();
      }
      await sidebar.getByRole('button', { name: `Delete folder ${folderName}`, exact: true }).click();
      await page.getByRole('dialog').last().getByRole('button', { name: /delete folder/i }).click();
    });

    test('detects two-tab optimistic concurrency conflict and shows ConflictModal', async ({
      context,
      page,
    }) => {
      const noteTitle = `Two-Tab Conflict ${Date.now()}`;

      await signIn(page);

      // Create note in Tab A
      await page.getByRole('button', { name: /new cozy note/i }).first().click();
      await expect(page).toHaveURL(/\/notes\/[0-9a-f-]+$/i);
      const noteUrl = page.url();

      const titleA = page.getByLabel(/note title/i);
      await titleA.fill(noteTitle);
      const initialSavePromise = waitForNotesPatch(page);
      await titleA.blur();
      await initialSavePromise;
      await expect(page.getByText(/^Saved$/i).first()).toBeVisible({ timeout: 10_000 });

      // Open same note in Tab B and wait until its editor & initial updated_at are loaded
      const tabB = await context.newPage();
      await tabB.goto(noteUrl);
      await expect(tabB.getByLabel(/note title/i)).toHaveValue(noteTitle);
      await expect(tabB.getByText(/^Saved$/i).first()).toBeVisible({ timeout: 10_000 });

      // Edit & save in Tab A first (advances server updated_at)
      const editorA = page.getByLabel(/note body editor/i);
      await editorA.click();
      await page.keyboard.type('Edit from Tab A');
      const tabASavePromise = waitForNotesPatch(page);
      await titleA.click();
      await tabASavePromise;
      await expect(page.getByText(/^Saved$/i).first()).toBeVisible({ timeout: 10_000 });

      // Edit in Tab B with stale updated_at, then blur editorB -> immediate flushSave() triggers ConflictModal
      const editorB = tabB.getByLabel(/note body editor/i);
      await editorB.click();
      await tabB.keyboard.type('Conflicting edit from Tab B');
      await tabB.getByLabel(/note title/i).click();

      await expect(tabB.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
      await expect(tabB.getByText(/newer version found/i)).toBeVisible();

      // Resolve by loading server version
      await tabB.getByRole('button', { name: /load server version/i }).click();
      await expect(tabB.getByLabel(/note body editor/i)).toContainText('Edit from Tab A');
      await tabB.close();

      // Clean up note
      const deletePatchPromise = waitForNotesPatch(page);
      await page.getByRole('banner').getByRole('button', { name: /delete note/i }).click();
      await page.getByRole('dialog').getByRole('button', { name: /delete note/i }).click();
      await deletePatchPromise;
      await expect(page).toHaveURL(/\/$/);
    });
  });
});
