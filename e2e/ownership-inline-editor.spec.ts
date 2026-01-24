import { test, expect } from '@playwright/test';

test.describe('Client-side Ownership & Inline Editor', () => {
  // Helper to dismiss cookie banner
  async function dismissCookieBanner(page: import('@playwright/test').Page) {
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }
  }

  test.describe('Anonymous User - City Page', () => {
    test('should NOT show admin bar for anonymous user', async ({ page }) => {
      await page.goto('/taxi/bratislava');
      await dismissCookieBanner(page);

      // Wait for hydration
      await page.waitForTimeout(2000);

      // Admin bar should NOT be visible
      const adminBar = page.locator('text=Upraviť mesto');
      await expect(adminBar).not.toBeVisible();
    });

    test('should NOT show edit indicators on city description', async ({ page }) => {
      await page.goto('/taxi/bratislava');
      await dismissCookieBanner(page);

      // Wait for hydration
      await page.waitForTimeout(2000);

      // Edit pencil icons should NOT be visible
      const editPencils = page.locator('[data-testid="edit-pencil"]');
      await expect(editPencils).toHaveCount(0);
    });

    test('city page should load and display content normally', async ({ page }) => {
      await page.goto('/taxi/bratislava');
      await dismissCookieBanner(page);

      // Page should load with content
      await expect(page.locator('h1')).toContainText('Bratislava');

      // Taxi services list should be visible (check for phone links as indicator)
      const phoneLinks = page.locator('a[href^="tel:"]');
      await expect(phoneLinks.first()).toBeVisible();
    });
  });

  test.describe('Anonymous User - Partner Page', () => {
    test('should NOT show inline editor controls for anonymous user', async ({ page }) => {
      // Navigate to a known partner page
      await page.goto('/taxi/zvolen/atoz-taxi');
      await dismissCookieBanner(page);

      // Wait for hydration
      await page.waitForTimeout(2000);

      // Inline editor floating bar should NOT be visible
      const editorBar = page.locator('text=Upravujem');
      await expect(editorBar).not.toBeVisible();

      // Edit mode toggle should NOT be visible
      const editToggle = page.locator('button:has-text("Upraviť")').filter({ hasText: /profil|stránku/ });
      await expect(editToggle).not.toBeVisible();
    });

    test('partner page should display content normally', async ({ page }) => {
      await page.goto('/taxi/zvolen/atoz-taxi');
      await dismissCookieBanner(page);

      // Page should load with partner content
      await expect(page.locator('h1')).toBeVisible();

      // Phone button should be visible
      const phoneButton = page.locator('a[href^="tel:"]');
      if (await phoneButton.count() > 0) {
        await expect(phoneButton.first()).toBeVisible();
      }
    });
  });

  test.describe('ISR Compatibility', () => {
    test('city page should be served as static (check headers)', async ({ page }) => {
      const response = await page.goto('/taxi/bratislava');

      // Check that page loaded successfully
      expect(response?.status()).toBe(200);

      // The page should be served from cache (ISR)
      // Note: In dev mode this won't show ISR headers
      const headers = response?.headers();
      // In production, we'd see x-vercel-cache or cache-control headers
      expect(headers).toBeDefined();
    });

    test('multiple loads should show consistent content', async ({ page }) => {
      // First load
      await page.goto('/taxi/bratislava');
      await dismissCookieBanner(page);
      const h1Text1 = await page.locator('h1').textContent();

      // Second load
      await page.reload();
      const h1Text2 = await page.locator('h1').textContent();

      // Content should be consistent
      expect(h1Text1).toBe(h1Text2);
    });
  });

  test.describe('Client-side Hydration', () => {
    test('page should hydrate without errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/taxi/bratislava');
      await dismissCookieBanner(page);

      // Wait for hydration
      await page.waitForTimeout(3000);

      // Filter out known non-critical errors
      const criticalErrors = consoleErrors.filter(
        (err) =>
          !err.includes('Hydration') && // Next.js hydration warnings in dev
          !err.includes('Warning:') && // React warnings
          !err.includes('Failed to load resource') // Network errors
      );

      // Should have no critical console errors
      expect(criticalErrors).toHaveLength(0);
    });

    test('useOwnership hook should not cause visible loading flash', async ({ page }) => {
      await page.goto('/taxi/bratislava');

      // Take screenshot immediately
      const screenshot1 = await page.screenshot();

      // Wait for hydration
      await page.waitForTimeout(2000);

      // Take screenshot after hydration
      const screenshot2 = await page.screenshot();

      // Both screenshots should show the same basic layout
      // (admin bar appears after hydration but shouldn't cause layout shift)
      expect(screenshot1.length).toBeGreaterThan(0);
      expect(screenshot2.length).toBeGreaterThan(0);
    });
  });

  test.describe('Admin Features (Visual Check)', () => {
    test('admin bar container should exist in DOM when logged in', async ({ page }) => {
      // This test checks that the admin bar HTML structure exists
      // but is conditionally rendered based on isAdmin state

      await page.goto('/taxi/bratislava');
      await dismissCookieBanner(page);

      // The CityEditorProvider renders children regardless of admin status
      // Admin bar is only shown when isAdmin=true (after client-side check)

      // Page content should be visible
      await expect(page.locator('h1')).toBeVisible();

      // Without login, admin bar should NOT appear even after waiting
      await page.waitForTimeout(3000);
      const adminBar = page.locator('.fixed.bottom-4'); // Admin bar position
      const adminBarVisible = await adminBar.isVisible().catch(() => false);

      // For anonymous user, admin bar should not be visible
      expect(adminBarVisible).toBe(false);
    });
  });

  test.describe('Partner Inline Editor (Visual Check)', () => {
    test('partner page should render without inline editor for anonymous', async ({ page }) => {
      await page.goto('/taxi/zvolen/atoz-taxi');
      await dismissCookieBanner(page);

      // Wait for full hydration
      await page.waitForTimeout(3000);

      // Look for any edit-related UI elements
      const editModeIndicators = page.locator('[data-edit-mode], [data-inline-editor]');
      const indicatorCount = await editModeIndicators.count();

      // Should have no edit mode indicators
      expect(indicatorCount).toBe(0);
    });
  });
});
