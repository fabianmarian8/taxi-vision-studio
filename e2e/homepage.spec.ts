import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Taxi NearMe/);
    await expect(page.locator('h1')).toContainText('Kompletný katalóg taxislužieb na Slovensku');
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      await page.locator('button:has-text("Akceptovať"), button:has-text("Súhlasím")').click();
    }

    const searchInput = page.locator('input[placeholder="Názov mesta, obce alebo PSČ..."]');
    await expect(searchInput).toBeVisible();
  });

  test('should display taxi services regions', async ({ page }) => {
    await page.goto('/');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      await page.locator('button:has-text("Akceptovať"), button:has-text("Súhlasím")').click();
    }

    // Check for taxi services section
    const taxiSection = page.locator('text=Taxislužby na Slovensku');
    await expect(taxiSection).toBeVisible();

    // Check for regions
    await expect(page.locator('text=Bratislavský kraj')).toBeVisible();
    await expect(page.locator('text=Košický kraj')).toBeVisible();
  });

  test('should navigate to city page when clicking city link', async ({ page }) => {
    await page.goto('/');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      await page.locator('button:has-text("Akceptovať"), button:has-text("Súhlasím")').click();
    }

    // Find first city link (from the cities list)
    const cityLink = page.locator('a[href^="/taxi/"]').first();
    const cityHref = await cityLink.getAttribute('href');

    await cityLink.click();

    // Wait for navigation and check URL
    await expect(page).toHaveURL(new RegExp(cityHref!));

    // Verify we're on a city page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that page loads properly on mobile
    await expect(page.locator('h1')).toBeVisible();

    // Check that search input is visible on mobile
    const searchInput = page.locator('input[placeholder="Názov mesta, obce alebo PSČ..."]');
    await expect(searchInput).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Check that page loads properly on desktop
    await expect(page.locator('h1')).toBeVisible();
    await expect(searchInput).toBeVisible();
  });

  test('should display "Ako to funguje" section', async ({ page }) => {
    await page.goto('/');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      await page.locator('button:has-text("Akceptovať"), button:has-text("Súhlasím")').click();
    }

    // Check for "Ako to funguje" section
    await expect(page.locator('text=Ako to funguje')).toBeVisible();
    await expect(page.locator('text=Vyhľadajte vaše mesto')).toBeVisible();
    await expect(page.locator('text=Nájdite v okolí')).toBeVisible();
    await expect(page.locator('text=Získajte odvoz')).toBeVisible();
  });
});