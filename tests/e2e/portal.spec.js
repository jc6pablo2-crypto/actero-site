import { test, expect } from '@playwright/test';

test.describe('portal end-to-end', () => {
  test.skip(!process.env.PORTAL_E2E_CLIENT_SEEDED, 'Set PORTAL_E2E_CLIENT_SEEDED=1 after seeding a test client in Supabase with portal_enabled=true and slug that matches ?portal=1 path');

  test('login page renders with merchant branding', async ({ page }) => {
    await page.goto('/?portal=1');
    await expect(page.getByText(/Mon espace SAV/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Recevoir mon lien/i })).toBeVisible();
  });

  test('submitting email shows confirmation', async ({ page }) => {
    await page.goto('/?portal=1');
    await page.getByPlaceholder('paul@example.com').fill('e2e-test@actero.fr');
    await page.getByRole('button', { name: /Recevoir mon lien/i }).click();
    await expect(page.getByText(/Vérifie ta boîte mail/i)).toBeVisible({ timeout: 10_000 });
  });
});
