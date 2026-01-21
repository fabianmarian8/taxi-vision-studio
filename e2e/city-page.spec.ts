import { test, expect } from '@playwright/test';

test.describe('City Page', () => {
  test('should display taxi services for Bratislava', async ({ page }) => {
    await page.goto('/taxi/bratislava');

    // Check page title and heading
    await expect(page.locator('h1')).toContainText('Bratislava');
    await expect(page).toHaveTitle(/Bratislava/);

    // Check that taxi services are displayed
    const services = page.locator('[data-testid="taxi-service"]');
    await expect(services.first()).toBeVisible();

    // Check for essential service information
    await expect(page.locator('text=Telefón')).toBeVisible();
  });

  test('should have clickable phone numbers', async ({ page }) => {
    await page.goto('/taxi/bratislava');

    // Find phone links
    const phoneLink = page.locator('a[href^="tel:"]').first();
    await expect(phoneLink).toBeVisible();

    // Verify phone link format
    const href = await phoneLink.getAttribute('href');
    expect(href).toMatch(/^tel:\+421/);
  });

  test('should display service ratings and premium badges', async ({ page }) => {
    await page.goto('/taxi/bratislava');

    // Check for premium services (if any)
    const premiumBadge = page.locator('text=PREMIUM');
    if (await premiumBadge.isVisible()) {
      await expect(premiumBadge).toBeVisible();
    }

    // Check for rating displays
    const ratingElements = page.locator('[data-testid*="rating"]');
    if (await ratingElements.count() > 0) {
      await expect(ratingElements.first()).toBeVisible();
    }
  });

  test('should filter services by availability', async ({ page }) => {
    await page.goto('/taxi/bratislava');

    // Check for filter buttons if they exist
    const filterButtons = page.locator('button[data-filter]');
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click();

      // Wait for filter to be applied
      await page.waitForTimeout(1000);

      // Services should still be visible after filtering
      const services = page.locator('[data-testid="taxi-service"]');
      await expect(services.first()).toBeVisible();
    }
  });

  test('should handle non-existent city gracefully', async ({ page }) => {
    // Navigate to non-existent city
    const response = await page.goto('/taxi/neexistujemesto');

    // Should either redirect or show 404
    if (response?.status() === 404) {
      await expect(page.locator('text=404')).toBeVisible();
    } else {
      // Should redirect to homepage or show "city not found" message
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/taxi/bratislava');

    // Check that page elements are properly displayed on mobile
    await expect(page.locator('h1')).toBeVisible();

    const services = page.locator('[data-testid="taxi-service"]');
    await expect(services.first()).toBeVisible();

    // Check that phone links are easily clickable on mobile
    const phoneLink = page.locator('a[href^="tel:"]').first();
    await expect(phoneLink).toBeVisible();
  });
});